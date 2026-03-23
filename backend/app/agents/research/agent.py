"""Research sub-agent configuration."""

from .prompts import RESEARCHER_INSTRUCTIONS
from .tools import tavily_search, think_tool
from .utils import get_today_str


def build_research_subagent() -> dict:
    """Build the research sub-agent descriptor for orchestration."""
    return {
        "name": "research-agent",
        "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
        "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=get_today_str()),
        "tools": [think_tool, tavily_search],
    }
