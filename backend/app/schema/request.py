"""Pydantic models for agent invocation APIs."""

from pydantic import BaseModel, Field


class AgentInvokeRequest(BaseModel):
    """Request body for invoking the orchestrator agent."""

    query: str = Field(..., min_length=1, description="User prompt to send to the agent.")
    thread_id: str | None = Field(
        default=None,
        description="Optional conversation thread id. A new one is created when omitted.",
    )


class AgentInvokeResponse(BaseModel):
    """Response body returned after the agent finishes."""

    response: str = Field(..., description="Final assistant response text.")
    thread_id: str = Field(..., description="Conversation thread id used for the request.")
