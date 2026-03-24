"""Main orchestrator graph configuration."""

import os

from deepagents import create_deep_agent

from ..llm import (
    build_gemini_model,
    build_summarization_model,
)
from .prompts import SUBAGENT_USAGE_INSTRUCTIONS, build_main_instructions
from .tools import get_orchestrator_tools, get_subagents
from .utils import build_subagent_instructions

# Ensure SKILLS_DIR is absolute so tests and server both find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE_DIR, ".agents", "skills")

SUBAGENT_INSTRUCTIONS = build_subagent_instructions(SUBAGENT_USAGE_INSTRUCTIONS)
INSTRUCTIONS = build_main_instructions(SUBAGENT_INSTRUCTIONS)


def build_research_agent(
    google_studio_api_key: str,
    tavily_api_key: str,
):
    """Create the orchestrator graph bound to runtime API keys."""
    active_google_key = google_studio_api_key.strip()
    active_tavily_key = tavily_api_key.strip()

    if not active_google_key:
        raise ValueError("google_studio_api_key is required")

    if not active_tavily_key:
        raise ValueError("tavily_api_key is required")

    model = build_gemini_model(active_google_key)
    summarization_model = build_summarization_model(active_google_key)

    return create_deep_agent(
        model=model,
        system_prompt=INSTRUCTIONS,
        tools=get_orchestrator_tools(model),
        subagents=get_subagents(active_tavily_key, summarization_model),
        debug=True,
    )
