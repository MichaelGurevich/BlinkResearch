"""Utility helpers specific to the orchestrator agent."""

from ..research.utils import get_today_str

MAX_CONCURRENT_RESEARCH_UNITS = 3
MAX_RESEARCHER_ITERATIONS = 3


def build_subagent_instructions(template: str) -> str:
    """Render orchestration instructions with runtime limits and date."""
    return template.format(
        max_concurrent_research_units=MAX_CONCURRENT_RESEARCH_UNITS,
        max_researcher_iterations=MAX_RESEARCHER_ITERATIONS,
        date=get_today_str(),
    )
