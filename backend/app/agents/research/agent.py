"""Research sub-agent configuration."""

from langchain_core.language_models import BaseChatModel

from .prompts import RESEARCHER_INSTRUCTIONS
from .tools import build_tavily_search_tool, think_tool
from .utils import get_today_str


def build_research_subagent(
    tavily_api_key: str,
    summarization_model: BaseChatModel,
) -> dict:
    """Build the research sub-agent descriptor for orchestration."""
    return {
        "name": "research-agent",
        "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
        "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=get_today_str()),
        "tools": [think_tool, build_tavily_search_tool(tavily_api_key, summarization_model)],
    }
