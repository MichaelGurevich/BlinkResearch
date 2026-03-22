import os
from deepagents import create_deep_agent
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver
from openapi import FallbackChat

from .tools import tavily_search, think_tool

# Ensure SKILLS_DIR is absolute so tests and server both find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE_DIR, ".agents", "skills")

# A specialized subagent for searching and reading papers
web_researcher = {
    "name": "research-agent",
    "description": "Searches the web and conducts thorough research.",
    "system_prompt": "You are an expert researcher. Use your tools to find accurate information and synthesize a raw report. Always use think_tool after tavily_search. ",
    "tools": [tavily_search, think_tool],
}

# A specialized subagent for synthesizing
writer = {
    "name": "writer",
    "description": "Synthesizes research notes into a coherent article or report.",
    "system_prompt": "You are an expert technical writer. Take raw research and format it into a beautifully structured markdown report.",
    "tools": [], # Can use filesystem tools provided by Deep Agents
}

# Ensure env vars are loaded since we initialize the model here
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

# FallbackChat provided by the openapi local package
model = FallbackChat(
    verbose=True,
    groq_api_key=os.getenv("GROQ_KEY", ""),
    cerebras_api_key=os.getenv("CEREBRAS_KEY", "")
)

# The main orchestrator graph
research_agent = create_deep_agent(
    name="deep-research-orchestrator",
    model=model,
    system_prompt=(
        "You are the Lead Deep Research Agent. "
        "Your job is to coordinate research tasks, break them down using your todo list, "
        "delegate information gathering to the 'research-agent', "
        "and delegate synthesis to the 'writer' subagent."
    ),
    subagents=[web_researcher, writer],
    backend=FilesystemBackend(root_dir=BASE_DIR, virtual_mode=True),
    skills=[SKILLS_DIR] if os.path.exists(SKILLS_DIR) else [],
    checkpointer=MemorySaver(),
)
