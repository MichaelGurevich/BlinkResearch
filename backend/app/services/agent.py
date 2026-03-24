"""Helpers for invoking the orchestrator agent from FastAPI routes."""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator, Iterable
from typing import Any

from fastapi import HTTPException

from app.agents import build_research_agent
from app.schema.request import AgentApiKeys, AgentInvokeRequest, AgentInvokeResponse


def _extract_text_content(content: Any) -> str:
    """Normalize LangChain/LangGraph message content into a plain string."""
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict) and part.get("type") == "text":
                text_parts.append(str(part.get("text", "")))
        return "\n".join(part for part in text_parts if part).strip()

    return str(content).strip()


def _get_message_text(message: Any) -> str:
    """Extract text from a message-like object."""
    content = getattr(message, "content", message)
    return _extract_text_content(content)


def _last_non_empty_message(messages: Iterable[Any]) -> str:
    """Return the last non-empty message text from an agent result."""
    final_message = ""
    for message in messages:
        text = _get_message_text(message)
        if text:
            final_message = text
    return final_message


def _require_api_keys(api_keys: AgentApiKeys | None) -> AgentApiKeys:
    """Return validated runtime API keys or raise a 400 response."""
    if api_keys is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing API keys. Provide both Tavily and Google AI Studio keys in the request."
            ),
        )
    return api_keys


def _normalize_todos(payload: Any) -> list[dict[str, str]] | None:
    """Normalize todo payloads from streamed graph state."""
    if not isinstance(payload, list):
        return None

    normalized: list[dict[str, str]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue

        content = str(item.get("content", "")).strip()
        status = str(item.get("status", "")).strip()
        if not content or status not in {"pending", "in_progress", "completed"}:
            continue

        normalized.append({"content": content, "status": status})

    return normalized


def _extract_todos(payload: Any) -> list[dict[str, str]] | None:
    """Find todo updates inside streamed LangGraph payloads."""
    if isinstance(payload, dict):
        direct_todos = _normalize_todos(payload.get("todos"))
        if direct_todos is not None:
            return direct_todos

        for value in payload.values():
            nested_todos = _extract_todos(value)
            if nested_todos is not None:
                return nested_todos

    if isinstance(payload, list):
        for item in payload:
            nested_todos = _extract_todos(item)
            if nested_todos is not None:
                return nested_todos

    return None


def _serialize_stream_event(event: dict[str, Any]) -> str:
    """Encode a stream event as one NDJSON line."""
    return json.dumps(event, ensure_ascii=False) + "\n"


def _build_agent(thread_id: str, api_keys: AgentApiKeys):
    """Create the orchestrator agent and runtime config for a request."""
    config = {"configurable": {"thread_id": thread_id}}
    research_agent = build_research_agent(
        google_studio_api_key=api_keys.google_studio_api_key,
        tavily_api_key=api_keys.tavily_api_key,
    )
    return research_agent, config


async def invoke_research_agent(request: AgentInvokeRequest) -> AgentInvokeResponse:
    """Invoke the orchestrator agent and return the final response payload."""
    thread_id = request.thread_id or str(uuid.uuid4())
    api_keys = _require_api_keys(request.api_keys)
    research_agent, config = _build_agent(thread_id, api_keys)

    result = await research_agent.ainvoke(
        {"messages": [{"role": "user", "content": request.query}]},
        config=config,
    )
    final_message = _last_non_empty_message(result.get("messages", [])) or "No response"

    return AgentInvokeResponse(response=final_message, thread_id=thread_id)


def stream_research_agent_events(request: AgentInvokeRequest) -> AsyncIterator[str]:
    """Stream normalized progress events for a research agent run."""
    thread_id = request.thread_id or str(uuid.uuid4())
    api_keys = _require_api_keys(request.api_keys)
    research_agent, config = _build_agent(thread_id, api_keys)

    async def event_stream() -> AsyncIterator[str]:
        yield _serialize_stream_event({"type": "started", "thread_id": thread_id})

        last_todos: list[dict[str, str]] | None = None
        final_message = ""

        try:
            async for part in research_agent.astream(
                {"messages": [{"role": "user", "content": request.query}]},
                config=config,
                stream_mode=["updates", "values"],
                version="v2",
            ):
                if not isinstance(part, dict):
                    continue

                part_type = part.get("type")
                payload = part.get("data")

                if part_type in {"updates", "values"}:
                    todos = _extract_todos(payload)
                    if todos is not None and todos != last_todos:
                        last_todos = todos
                        yield _serialize_stream_event(
                            {
                                "type": "todos",
                                "thread_id": thread_id,
                                "todos": todos,
                            }
                        )

                if part_type == "values" and isinstance(payload, dict):
                    final_message = _last_non_empty_message(payload.get("messages", []))

            yield _serialize_stream_event(
                {
                    "type": "final",
                    "thread_id": thread_id,
                    "response": final_message or "No response",
                }
            )
        except Exception as exc:
            yield _serialize_stream_event(
                {
                    "type": "error",
                    "thread_id": thread_id,
                    "error": str(exc).strip() or exc.__class__.__name__,
                }
            )

    return event_stream()
