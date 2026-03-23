import os
from deepagents import create_deep_agent
from datetime import datetime
from deepagents.backends import FilesystemBackend
from langgraph.checkpoint.memory import MemorySaver
# from openapi import FallbackChat
from langchain_groq import ChatGroq
#from langchain_cerebras import ChatCerebras
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler
from .prompts import (
    FILE_USAGE_INSTRUCTIONS,
    RESEARCHER_INSTRUCTIONS,
    SUBAGENT_USAGE_INSTRUCTIONS,
    TODO_USAGE_INSTRUCTIONS,
)

from .tools import tavily_search, think_tool


sub_agent_tools = [think_tool, tavily_search]




def get_today_str() -> str:
    """Get current date in a human-readable format."""
    return datetime.now().strftime("%a %b %#d, %Y")

# Ensure SKILLS_DIR is absolute so tests and server both find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE_DIR, ".agents", "skills")





# Ensure env vars are loaded since we initialize the model here
from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from langchain_google_genai import ChatGoogleGenerativeAI

# FallbackChat provided by the openapi local package
# model = FallbackChat(
#     rpm_limiter=True,
#     verbose=True,
#     groq_api_key=os.getenv("GROQ_KEY", ""),
#     cerebras_api_key=os.getenv("CEREBRAS_KEY", "")
# )

from langchain_core.callbacks import StdOutCallbackHandler, BaseCallbackHandler
import time

class RateLimitDelayHandler(BaseCallbackHandler):
    """Wait 2 seconds before every LLM call to avoid 429 errors."""
    def on_llm_start(self, serialized, prompts, **kwargs):
        time.sleep(2)

# Langfuse observability
langfuse_handler = LangfuseCallbackHandler()
stdout_handler = StdOutCallbackHandler()
delay_handler = RateLimitDelayHandler()

model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    api_key=os.getenv("GEMINI_KEY", ""),
    callbacks=[langfuse_handler, stdout_handler, delay_handler],

)

# Limits
max_concurrent_research_units = 3
max_researcher_iterations = 3

SUBAGENT_INSTRUCTIONS = SUBAGENT_USAGE_INSTRUCTIONS.format(
    max_concurrent_research_units=max_concurrent_research_units,
    max_researcher_iterations=max_researcher_iterations,
    date=datetime.now().strftime("%a %b %#d, %Y"),
)

# A specialized subagent for searching and reading papers
web_researcher = {
    "name": "research-agent",
    "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
    "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=get_today_str()),
    "tools": sub_agent_tools,
}

INSTRUCTIONS = (
    "# TODO MANAGEMENT\n"
    + TODO_USAGE_INSTRUCTIONS
    + "\n\n"
    + "=" * 80
    + "\n\n"
    + "# FILE SYSTEM USAGE\n"
    + FILE_USAGE_INSTRUCTIONS
    + "\n\n"
    + "=" * 80
    + "\n\n"
    + "# SUB-AGENT DELEGATION\n"
    + SUBAGENT_INSTRUCTIONS
)

# The main orchestrator graph
research_agent = create_deep_agent(
    model=model,
    tools=sub_agent_tools,
    system_prompt=INSTRUCTIONS,
    subagents=[web_researcher],
    debug=True,
)
