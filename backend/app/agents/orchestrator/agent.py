"""Main orchestrator graph configuration."""

import os

from deepagents import create_deep_agent
from dotenv import load_dotenv

from ..llm import (
    build_gemini_model,
    build_summarization_model,
    get_default_gemini_api_key,
)
from .prompts import SUBAGENT_USAGE_INSTRUCTIONS, build_main_instructions
from .tools import get_orchestrator_tools, get_subagents
from .utils import build_subagent_instructions

# Ensure SKILLS_DIR is absolute so tests and server both find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE_DIR, ".agents", "skills")

load_dotenv(os.path.join(BASE_DIR, ".env"))

SUBAGENT_INSTRUCTIONS = build_subagent_instructions(SUBAGENT_USAGE_INSTRUCTIONS)
INSTRUCTIONS = build_main_instructions(SUBAGENT_INSTRUCTIONS)


def build_research_agent(
    google_studio_api_key: str | None = None,
    tavily_api_key: str | None = None,
):
    """Create the orchestrator graph bound to runtime API keys."""
    active_google_key = google_studio_api_key or get_default_gemini_api_key()
    active_tavily_key = tavily_api_key or os.getenv("TAVILY_KEY", "")

    model = build_gemini_model(active_google_key)
    summarization_model = build_summarization_model(active_google_key)

    return create_deep_agent(
        model=model,
        system_prompt=INSTRUCTIONS,
        tools=get_orchestrator_tools(model),
        subagents=get_subagents(active_tavily_key, summarization_model),
        debug=True,
    )


research_agent = build_research_agent()
