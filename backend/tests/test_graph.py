import asyncio
import sys

sys.path.insert(0, r"c:\Coding\BlinkResearch\backend")
from dotenv import load_dotenv
load_dotenv(r"c:\Coding\BlinkResearch\backend\.env")

from app.agents.graph import research_agent


async def main():
    query = "I want to visit Bansko Bulgaria for a ski trip, give me a detailed plan and research for me the topic"
    config = {"configurable": {"thread_id": "test-6"}}

    result = await research_agent.ainvoke(
        {"messages": [{"role": "user", "content": query}]},
        config=config,
    )

    for msg in result.get("messages", []):
        if hasattr(msg, "pretty_print"):
            msg.pretty_print()


asyncio.run(main())