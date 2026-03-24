from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Frontend origins allowed to call the backend API.
# Keep this explicit to avoid hidden behavior from environment files.
ALLOWED_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://d49jore6lxrzy.cloudfront.net",
)

from app.schema.request import AgentInvokeRequest, AgentInvokeResponse
from app.services.agent import invoke_research_agent, stream_research_agent_events

app = FastAPI(title="Deep Research Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_CORS_ORIGINS),
    allow_origin_regex=None,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "Deep Research Agent API",
        "status": "ok",
        "health": "/health",
    }


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
