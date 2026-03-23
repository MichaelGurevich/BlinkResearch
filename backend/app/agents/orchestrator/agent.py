"""Main orchestrator graph configuration."""

import os

from deepagents import create_deep_agent
from dotenv import load_dotenv

from ..llm import model
from .prompts import SUBAGENT_USAGE_INSTRUCTIONS, build_main_instructions
from .tools import get_orchestrator_tools, get_subagents
from .utils import build_subagent_instructions

# Ensure SKILLS_DIR is absolute so tests and server both find it
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKILLS_DIR = os.path.join(BASE_DIR, ".agents", "skills")

load_dotenv(os.path.join(BASE_DIR, ".env"))

SUBAGENT_INSTRUCTIONS = build_subagent_instructions(SUBAGENT_USAGE_INSTRUCTIONS)
INSTRUCTIONS = build_main_instructions(SUBAGENT_INSTRUCTIONS)

# The main orchestrator graph
research_agent = create_deep_agent(
    model=model,
    system_prompt=INSTRUCTIONS,
    tools=get_orchestrator_tools(),
    subagents=get_subagents(),
    debug=True,
)
