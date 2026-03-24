import os
import time

from dotenv import load_dotenv
from langchain_core.callbacks import BaseCallbackHandler, StdOutCallbackHandler
from langchain_core.language_models import BaseChatModel
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler

from app.google_model_backoff import (
    DEFAULT_GEMINI_MODEL_ID,
    build_google_model_fallback_chat_model,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))


class RateLimitDelayHandler(BaseCallbackHandler):
    """Wait 2 seconds before every LLM call to avoid 429 errors."""

    def on_llm_start(self, serialized, prompts, **kwargs):
        time.sleep(2)

stdout_handler = StdOutCallbackHandler()
delay_handler = RateLimitDelayHandler()
base_callbacks = [stdout_handler, delay_handler]

if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
    base_callbacks.insert(0, LangfuseCallbackHandler())


def get_default_gemini_api_key() -> str:
    """Return the default Gemini-compatible API key from environment variables."""
    return (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GEMINI_KEY", "")
    )


def build_gemini_model(
    api_key: str | None = None,
    preferred_model_id: str = DEFAULT_GEMINI_MODEL_ID,
) -> BaseChatModel:
    """Create the Gemini model used by the orchestrator with automatic fallback."""
    return build_google_model_fallback_chat_model(
        api_key=api_key or get_default_gemini_api_key(),
        preferred_model_id=preferred_model_id,
        callbacks=list(base_callbacks),
    )


def build_summarization_model(
    api_key: str | None = None,
    preferred_model_id: str = DEFAULT_GEMINI_MODEL_ID,
) -> BaseChatModel:
    """Create the Gemini model used for summarization with automatic fallback."""
    return build_google_model_fallback_chat_model(
        api_key=api_key or get_default_gemini_api_key(),
        preferred_model_id=preferred_model_id,
        callbacks=list(base_callbacks),
    )


model = build_gemini_model()
summarization_model = build_summarization_model()

