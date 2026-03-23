"""Helpers for invoking the orchestrator agent from FastAPI routes."""

from __future__ import annotations

import uuid
from collections.abc import Iterable
from typing import Any

from app.agents import research_agent
from app.schema.request import AgentInvokeRequest, AgentInvokeResponse


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


async def invoke_research_agent(request: AgentInvokeRequest) -> AgentInvokeResponse:
    """Invoke the orchestrator agent and return the final response payload."""
    thread_id = request.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    result = await research_agent.ainvoke(
        {"messages": [{"role": "user", "content": request.query}]},
        config=config,
    )
    final_message = _last_non_empty_message(result.get("messages", [])) or "No response"

    return AgentInvokeResponse(response=final_message, thread_id=thread_id)
