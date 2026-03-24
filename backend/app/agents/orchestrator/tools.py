"""Helpers and tools for orchestrator wiring."""

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

from ..research.agent import build_research_subagent
from .prompts import MD_FORMATTER_PROMPT


def _extract_text_content(content) -> str:
    """Normalize model content payloads into plain text."""
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                text_parts.append(part)
            elif isinstance(part, dict) and part.get("type") == "text":
                text_parts.append(part.get("text", ""))
        return "\n".join([p for p in text_parts if p]).strip()

    return str(content).strip()


def build_md_formatter_tool(model: BaseChatModel):
    """Create a formatter tool bound to the active orchestrator model."""

    @tool(parse_docstring=True, return_direct=True)
    def md_formatter(markdown_text: str) -> str:
        """Format the final response using an LLM before sending to the user.

        This is the orchestrator's ".md formatter" finalization tool.

        Args:
            markdown_text: Draft final response text to format as Markdown.

        Returns:
            An LLM-formatted Markdown string ready to be returned directly to the user.
        """
        prompt = MD_FORMATTER_PROMPT.format(markdown_text=markdown_text)

        try:
            response = model.invoke([HumanMessage(content=prompt)])
            formatted = _extract_text_content(response.content)
            return formatted if formatted else markdown_text.strip()
        except Exception:
            # Preserve delivery even if formatter call fails.
            return markdown_text.strip()

    return md_formatter


def get_subagents(
    tavily_api_key: str,
    summarization_model: BaseChatModel,
) -> list[dict]:
    """Return the orchestrator's configured sub-agents."""
    return [build_research_subagent(tavily_api_key, summarization_model)]


def get_orchestrator_tools(model: BaseChatModel) -> list:
    """Return orchestrator-level tools available to the main agent."""
    return [build_md_formatter_tool(model)]
