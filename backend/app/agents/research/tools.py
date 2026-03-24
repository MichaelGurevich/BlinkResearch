"""Tools used by the research sub-agent."""

import base64
import os
import sys
import time
import uuid

# Increase recursion depth to accommodate very deep HTML parsing by markdownify / BeautifulSoup
sys.setrecursionlimit(10000)

import httpx
from deepagents.backends.utils import create_file_data
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import InjectedToolArg, InjectedToolCallId, tool
from langgraph.prebuilt import InjectedState
from langgraph.types import Command
from markdownify import markdownify
from pydantic import BaseModel, Field
from tavily import TavilyClient
from typing_extensions import Annotated, Literal

from ..state import DeepAgentState
from .prompts import SUMMARIZE_WEB_SEARCH
from .utils import get_today_str


class Summary(BaseModel):
    """Schema for webpage content summarization."""

    filename: str = Field(description="Name of the file to store.")
    summary: str = Field(description="Key learnings from the webpage.")


def run_tavily_search(
    tavily_client: TavilyClient,
    search_query: str,
    max_results: int = 1,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = True,
) -> dict:
    """Perform search using Tavily API for a single query."""
    return tavily_client.search(
        search_query,
        max_results=max_results,
        include_raw_content=include_raw_content,
        topic=topic,
    )


def summarize_webpage_content(
    summarization_model: BaseChatModel,
    webpage_content: str,
) -> Summary:
    """Summarize webpage content using the configured summarization model."""
    try:
        structured_model = summarization_model.with_structured_output(Summary)
        summary_and_filename = structured_model.invoke(
            [
                HumanMessage(
                    content=SUMMARIZE_WEB_SEARCH.format(
                        webpage_content=webpage_content,
                        date=get_today_str(),
                    )
                )
            ]
        )
        return summary_and_filename
    except Exception:
        return Summary(
            filename="search_result.md",
            summary=(
                webpage_content[:1000] + "..."
                if len(webpage_content) > 1000
                else webpage_content
            ),
        )


def process_search_results(
    results: dict,
    summarization_model: BaseChatModel,
) -> list[dict]:
    """Process search results by summarizing content where available."""
    processed_results = []
    http_client = httpx.Client(timeout=30.0)

    for result in results.get("results", []):
        time.sleep(2)
        url = result["url"]

        try:
            response = http_client.get(url)
            if response.status_code == 200:
                raw_content = markdownify(response.text)
                summary_obj = summarize_webpage_content(summarization_model, raw_content)
            else:
                raw_content = result.get("raw_content", "")
                summary_obj = Summary(
                    filename="url_error.md",
                    summary=result.get(
                        "content", "Error reading URL; try another search."
                    ),
                )
        except (httpx.TimeoutException, httpx.RequestError):
            raw_content = result.get("raw_content", "")
            summary_obj = Summary(
                filename="connection_error.md",
                summary=result.get(
                    "content",
                    "Could not fetch URL (timeout/connection error). Try another search.",
                ),
            )

        uid = (
            base64.urlsafe_b64encode(uuid.uuid4().bytes)
            .rstrip(b"=")
            .decode("ascii")[:8]
        )
        name, ext = os.path.splitext(summary_obj.filename)
        summary_obj.filename = f"{name}_{uid}{ext}"

        processed_results.append(
            {
                "url": result["url"],
                "title": result["title"],
                "summary": summary_obj.summary,
                "filename": summary_obj.filename,
                "raw_content": raw_content,
            }
        )

    return processed_results


def build_tavily_search_tool(
    tavily_api_key: str,
    summarization_model: BaseChatModel,
):
    """Create a Tavily search tool bound to a specific runtime API key."""
    tavily_client = TavilyClient(api_key=tavily_api_key)

    @tool(parse_docstring=True)
    def tavily_search(
        query: str,
        state: Annotated[DeepAgentState, InjectedState],
        tool_call_id: Annotated[str, InjectedToolCallId],
        max_results: Annotated[int, InjectedToolArg] = 1,
        topic: Annotated[Literal["general", "news", "finance"], InjectedToolArg] = "general",
    ) -> Command:
        """Search web and save detailed results to files while returning minimal context.

        Args:
            query: Search query to execute
            state: Injected agent state for file storage
            tool_call_id: Injected tool call identifier
            max_results: Maximum number of results to return (default: 1)
            topic: Topic filter - 'general', 'news', or 'finance' (default: 'general')

        Returns:
            Command that saves full results to files and provides minimal summary
        """
        search_results = run_tavily_search(
            tavily_client,
            query,
            max_results=max_results,
            topic=topic,
            include_raw_content=True,
        )
        processed_results = process_search_results(search_results, summarization_model)

        files = state.get("files", {})
        saved_files = []
        summaries = []

        for result in processed_results:
            filename = result["filename"]
            file_content = f"""# Search Result: {result['title']}

**URL:** {result['url']}
**Query:** {query}
**Date:** {get_today_str()}

## Summary
{result['summary']}

## Raw Content
{result['raw_content'] if result['raw_content'] else 'No raw content available'}
"""

            files[filename] = create_file_data(file_content)
            saved_files.append(filename)
            summaries.append(f"- {filename}: {result['summary']}...")

        summary_text = f"""Found {len(processed_results)} result(s) for '{query}':

{chr(10).join(summaries)}

Files: {', '.join(saved_files)}
Use read_file() to access full details when needed."""

        return Command(
            update={
                "files": files,
                "messages": [ToolMessage(summary_text, tool_call_id=tool_call_id)],
            }
        )

    return tavily_search


@tool(parse_docstring=True)
def think_tool(reflection: str) -> str:
    """Tool for strategic reflection on research progress and decision-making.

    Args:
        reflection: Your detailed reflection on research progress, findings, gaps, and next steps

    Returns:
        Confirmation that reflection was recorded for decision-making
    """
    return f"Reflection recorded: {reflection}"
