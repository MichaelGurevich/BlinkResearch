"""Pydantic models for agent invocation APIs."""

from pydantic import BaseModel, Field


class AgentApiKeys(BaseModel):
    """User-provided API keys required for a research session."""

    tavily_api_key: str = Field(
        ...,
        min_length=1,
        description="Tavily API key supplied by the user.",
    )
    google_studio_api_key: str = Field(
        ...,
        min_length=1,
        description="Google AI Studio API key supplied by the user.",
    )


class AgentInvokeRequest(BaseModel):
    """Request body for invoking the orchestrator agent."""

    query: str = Field(..., min_length=1, description="User prompt to send to the agent.")
    thread_id: str | None = Field(
        default=None,
        description="Optional conversation thread id. A new one is created when omitted.",
    )
    api_keys: AgentApiKeys | None = Field(
        default=None,
        description="Optional user-provided API keys for runtime configuration.",
    )


class AgentInvokeResponse(BaseModel):
    """Response body returned after the agent finishes."""

    response: str = Field(..., description="Final assistant response text.")
    thread_id: str = Field(..., description="Conversation thread id used for the request.")
