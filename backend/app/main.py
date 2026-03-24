from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

from app.schema.request import AgentInvokeRequest, AgentInvokeResponse
from app.services.agent import invoke_research_agent, stream_research_agent_events

app = FastAPI(title="Deep Research Agent API")


@app.post("/api/agent/invoke", response_model=AgentInvokeResponse)
async def invoke_agent(request: AgentInvokeRequest) -> AgentInvokeResponse:
    """Invoke the orchestrator agent and return its final answer."""
    return await invoke_research_agent(request)


@app.post("/api/agent/stream")
async def stream_agent(request: AgentInvokeRequest) -> StreamingResponse:
    """Stream agent progress updates and the final answer."""
    return StreamingResponse(
        stream_research_agent_events(request),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache"},
    )


@app.post("/api/research", response_model=AgentInvokeResponse)
async def start_research(request: AgentInvokeRequest) -> AgentInvokeResponse:
    """Backward-compatible alias for the research endpoint."""
    return await invoke_research_agent(request)


@app.post("/api/research/stream")
async def stream_research(request: AgentInvokeRequest) -> StreamingResponse:
    """Backward-compatible streaming alias for the research endpoint."""
    return StreamingResponse(
        stream_research_agent_events(request),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
