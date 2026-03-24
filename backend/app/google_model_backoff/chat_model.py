"""Fallback-aware LangChain wrapper for Google Gemini chat models."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import time
from collections.abc import Awaitable, Callable, Sequence
from threading import Lock
from typing import Any, TypeVar

from google.genai.errors import APIError
from google.genai.types import Tool as GoogleTool
from google.genai.types import ToolConfig
from langchain_core.callbacks.manager import (
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForLLMRun,
)
from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatResult
from langchain_core.runnables import Runnable, RunnableConfig, RunnableLambda
from langchain_core.tools import BaseTool
from langchain_core.utils.function_calling import convert_to_openai_tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai._function_utils import (
    _ToolChoiceType,
    convert_to_genai_function_declarations,
    tool_to_dict,
)
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr

from .models import build_model_sequence, get_model_display_name

logger = logging.getLogger(__name__)

T = TypeVar("T")

_MODEL_FAILURE_STATE_LOCK = Lock()
_DISABLED_MODELS_BY_API_KEY: dict[str, set[str]] = {}

_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}
_RETRYABLE_STATUS_NAMES = {
    "DEADLINE_EXCEEDED",
    "INTERNAL",
    "RESOURCE_EXHAUSTED",
    "UNAVAILABLE",
}
_RETRYABLE_MESSAGE_SNIPPETS = (
    "429",
    "daily limit",
    "high demand",
    "overloaded",
    "quota",
    "rate limit",
    "resource exhausted",
    "resource_exhausted",
    "service unavailable",
    "too many requests",
)


class GoogleModelFallbackExhaustedError(RuntimeError):
    """Raised when every configured Google model fails with retryable errors."""

    def __init__(self, attempted_models: Sequence[str], last_error: BaseException):
        attempted = ", ".join(attempted_models)
        super().__init__(
            "All configured Google models failed with retryable errors. "
            f"Attempted models: {attempted}. Last error: {last_error}"
        )
        self.attempted_models = tuple(attempted_models)
        self.last_error = last_error


def _get_api_key_scope(api_key: str) -> str:
    """Return a stable non-sensitive key for shared model failure tracking."""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def get_disabled_google_models(api_key: str) -> tuple[str, ...]:
    """Return the models disabled for this API key in the current process."""
    scope = _get_api_key_scope(api_key)
    with _MODEL_FAILURE_STATE_LOCK:
        disabled = _DISABLED_MODELS_BY_API_KEY.get(scope, set())
        return tuple(sorted(disabled))


def disable_google_model(api_key: str, model_id: str) -> None:
    """Mark a model as unavailable for future calls for this API key."""
    scope = _get_api_key_scope(api_key)
    with _MODEL_FAILURE_STATE_LOCK:
        disabled = _DISABLED_MODELS_BY_API_KEY.setdefault(scope, set())
        disabled.add(model_id)


def reset_disabled_google_models(api_key: str | None = None) -> None:
    """Clear disabled-model state for one API key or for the whole process."""
    with _MODEL_FAILURE_STATE_LOCK:
        if api_key is None:
            _DISABLED_MODELS_BY_API_KEY.clear()
            return

        scope = _get_api_key_scope(api_key)
        _DISABLED_MODELS_BY_API_KEY.pop(scope, None)


def _iter_exception_chain(error: BaseException):
    """Yield the error and its chained causes without looping forever."""
    current: BaseException | None = error
    seen: set[int] = set()

    while current is not None and id(current) not in seen:
        seen.add(id(current))
        yield current
        current = current.__cause__ or current.__context__


def _summarize_error(error: BaseException) -> str:
    """Build a compact log-friendly description for a Google API error."""
    for current in _iter_exception_chain(error):
        if isinstance(current, APIError):
            return (
                f"code={current.code}, status={current.status}, "
                f"message={current.message or str(current)}"
            )
    return str(error)


def should_switch_google_model(error: BaseException) -> bool:
    """Return whether an error should trigger a fallback to the next model."""
    for current in _iter_exception_chain(error):
        if isinstance(current, APIError):
            if current.code in _RETRYABLE_STATUS_CODES:
                return True

            status = (current.status or "").upper()
            if status in _RETRYABLE_STATUS_NAMES:
                return True

            message = (current.message or str(current)).lower()
            if any(snippet in message for snippet in _RETRYABLE_MESSAGE_SNIPPETS):
                return True

        message = str(current).lower()
        if any(snippet in message for snippet in _RETRYABLE_MESSAGE_SNIPPETS):
            return True

    return False


class GoogleModelFallbackChatModel(BaseChatModel):
    """BaseChatModel that retries the request against the next Google model."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    api_key: str = Field(default="", repr=False)
    model_ids: tuple[str, ...] = Field(default_factory=build_model_sequence)
    model_options: dict[str, Any] = Field(default_factory=dict)
    switch_backoff_seconds: float = Field(default=1.0, ge=0.0)
    max_switch_backoff_seconds: float = Field(default=8.0, ge=0.0)

    _model_cache: dict[str, ChatGoogleGenerativeAI] = PrivateAttr(default_factory=dict)

    @property
    def preferred_model_id(self) -> str:
        """Return the first model used before any fallback occurs."""
        if not self.model_ids:
            raise ValueError("No Google models are configured for fallback.")
        return self.model_ids[0]

    @property
    def _llm_type(self) -> str:
        return "google-model-fallback-chat"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {
            "preferred_model_id": self.preferred_model_id,
            "fallback_model_ids": list(self.model_ids[1:]),
            **self.model_options,
        }

    def _get_chat_model(self, model_id: str) -> ChatGoogleGenerativeAI:
        """Return a cached LangChain Google model instance for a model id."""
        if model_id not in self._model_cache:
            self._model_cache[model_id] = ChatGoogleGenerativeAI(
                model=model_id,
                api_key=self.api_key,
                callbacks=self.callbacks,
                metadata=self.metadata,
                tags=self.tags,
                verbose=self.verbose,
                **self.model_options,
            )

        return self._model_cache[model_id]

    def _retry_delay(self, retry_index: int) -> float:
        """Return the sleep time before the next fallback attempt."""
        delay = self.switch_backoff_seconds * (2 ** max(retry_index - 1, 0))
        return min(delay, self.max_switch_backoff_seconds)

    def _get_active_model_ids(self) -> tuple[str, ...]:
        """Return the current ordered model list after removing disabled models."""
        disabled_model_ids = set(get_disabled_google_models(self.api_key))
        return tuple(
            model_id for model_id in self.model_ids if model_id not in disabled_model_ids
        )

    def _annotate_result(
        self,
        result: T,
        active_model_id: str,
        attempted_models: Sequence[str],
    ) -> T:
        """Attach model metadata to chat responses without altering other outputs."""
        if not isinstance(result, ChatResult):
            return result

        metadata = {
            "google_model_id": active_model_id,
            "google_model_name": get_model_display_name(active_model_id),
            "google_attempted_models": list(attempted_models),
        }

        if isinstance(result.llm_output, dict):
            result.llm_output = {**result.llm_output, **metadata}
        elif result.llm_output is None:
            result.llm_output = metadata.copy()

        for generation in result.generations:
            existing = dict(getattr(generation.message, "response_metadata", {}) or {})
            generation.message.response_metadata = {**existing, **metadata}

        return result

    def _run_with_fallback(
        self,
        operation_name: str,
        runner: Callable[[ChatGoogleGenerativeAI], T],
    ) -> T:
        """Run a sync operation against the preferred model and fail over if needed."""
        active_model_ids = self._get_active_model_ids()
        if not active_model_ids:
            disabled_models = get_disabled_google_models(self.api_key)
            raise GoogleModelFallbackExhaustedError(
                attempted_models=disabled_models or self.model_ids,
                last_error=RuntimeError(
                    "All Google models are already disabled for this API key."
                ),
            )

        attempted_models: list[str] = []
        last_error: BaseException | None = None

        for index, model_id in enumerate(active_model_ids):
            attempted_models.append(model_id)
            model = self._get_chat_model(model_id)

            try:
                result = runner(model)
                return self._annotate_result(result, model_id, attempted_models)
            except Exception as error:
                if not should_switch_google_model(error):
                    raise

                disable_google_model(self.api_key, model_id)
                last_error = error
                has_next_model = index + 1 < len(active_model_ids)
                if not has_next_model:
                    break

                next_model_id = active_model_ids[index + 1]
                delay = self._retry_delay(index + 1)
                logger.warning(
                    "Google model '%s' failed during %s with a retryable error. "
                    "It has been disabled for future calls for this API key. "
                    "Switching to '%s' in %.1fs. Error: %s",
                    model_id,
                    operation_name,
                    next_model_id,
                    delay,
                    _summarize_error(error),
                )
                time.sleep(delay)

        if last_error is None:
            raise ValueError("No Google models are configured for fallback.")

        raise GoogleModelFallbackExhaustedError(attempted_models, last_error) from last_error

    async def _arun_with_fallback(
        self,
        operation_name: str,
        runner: Callable[[ChatGoogleGenerativeAI], Awaitable[T]],
    ) -> T:
        """Run an async operation against the preferred model and fail over if needed."""
        active_model_ids = self._get_active_model_ids()
        if not active_model_ids:
            disabled_models = get_disabled_google_models(self.api_key)
            raise GoogleModelFallbackExhaustedError(
                attempted_models=disabled_models or self.model_ids,
                last_error=RuntimeError(
                    "All Google models are already disabled for this API key."
                ),
            )

        attempted_models: list[str] = []
        last_error: BaseException | None = None

        for index, model_id in enumerate(active_model_ids):
            attempted_models.append(model_id)
            model = self._get_chat_model(model_id)

            try:
                result = await runner(model)
                return self._annotate_result(result, model_id, attempted_models)
            except Exception as error:
                if not should_switch_google_model(error):
                    raise

                disable_google_model(self.api_key, model_id)
                last_error = error
                has_next_model = index + 1 < len(active_model_ids)
                if not has_next_model:
                    break

                next_model_id = active_model_ids[index + 1]
                delay = self._retry_delay(index + 1)
                logger.warning(
                    "Google model '%s' failed during %s with a retryable error. "
                    "It has been disabled for future calls for this API key. "
                    "Switching to '%s' in %.1fs. Error: %s",
                    model_id,
                    operation_name,
                    next_model_id,
                    delay,
                    _summarize_error(error),
                )
                await asyncio.sleep(delay)

        if last_error is None:
            raise ValueError("No Google models are configured for fallback.")

        raise GoogleModelFallbackExhaustedError(attempted_models, last_error) from last_error

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        return self._run_with_fallback(
            operation_name="chat generation",
            runner=lambda model: model._generate(
                messages,
                stop=stop,
                run_manager=run_manager,
                **kwargs,
            ),
        )

    async def _agenerate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: AsyncCallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        return await self._arun_with_fallback(
            operation_name="async chat generation",
            runner=lambda model: model._agenerate(
                messages,
                stop=stop,
                run_manager=run_manager,
                **kwargs,
            ),
        )

    def bind_tools(
        self,
        tools: Sequence[
            dict[str, Any] | type | Callable[..., Any] | BaseTool | GoogleTool
        ],
        tool_config: dict | ToolConfig | None = None,
        *,
        tool_choice: _ToolChoiceType | bool | None = None,
        **kwargs: Any,
    ) -> Runnable[LanguageModelInput, AIMessage]:
        """Bind tools so downstream LangChain agents can use tool calling normally."""
        try:
            formatted_tools: list = [convert_to_openai_tool(tool) for tool in tools]
        except Exception:
            formatted_tools = [
                tool_to_dict(tool)
                for tool in convert_to_genai_function_declarations(tools)
            ]

        if tool_choice:
            kwargs["tool_choice"] = tool_choice
        if tool_config:
            kwargs["tool_config"] = tool_config

        return self.bind(tools=formatted_tools, **kwargs)

    def with_structured_output(
        self,
        schema: dict | type[BaseModel],
        method: str | None = "json_schema",
        *,
        include_raw: bool = False,
        **kwargs: Any,
    ) -> Runnable[LanguageModelInput, dict | BaseModel]:
        """Return a runnable that falls back across models for structured output."""

        def invoke_with_fallback(
            input_value: LanguageModelInput,
            config: RunnableConfig | None = None,
        ):
            return self._run_with_fallback(
                operation_name="structured output generation",
                runner=lambda model: model.with_structured_output(
                    schema,
                    method=method,
                    include_raw=include_raw,
                    **kwargs,
                ).invoke(input_value, config=config),
            )

        async def ainvoke_with_fallback(
            input_value: LanguageModelInput,
            config: RunnableConfig | None = None,
        ):
            return await self._arun_with_fallback(
                operation_name="async structured output generation",
                runner=lambda model: model.with_structured_output(
                    schema,
                    method=method,
                    include_raw=include_raw,
                    **kwargs,
                ).ainvoke(input_value, config=config),
            )

        return RunnableLambda(
            invoke_with_fallback,
            afunc=ainvoke_with_fallback,
            name="google_model_fallback_structured_output",
        )


def build_google_model_fallback_chat_model(
    api_key: str,
    *,
    preferred_model_id: str | None = None,
    callbacks: Any = None,
    switch_backoff_seconds: float = 1.0,
    max_switch_backoff_seconds: float = 8.0,
    **model_options: Any,
) -> GoogleModelFallbackChatModel:
    """Build a Google Gemini chat model with automatic model fallback."""
    return GoogleModelFallbackChatModel(
        api_key=api_key,
        model_ids=build_model_sequence(preferred_model_id),
        callbacks=callbacks,
        switch_backoff_seconds=switch_backoff_seconds,
        max_switch_backoff_seconds=max_switch_backoff_seconds,
        model_options=model_options,
    )
