import asyncio
import sys

sys.path.insert(0, r"c:\Coding\BlinkResearch\backend")
from dotenv import load_dotenv
load_dotenv(r"c:\Coding\BlinkResearch\backend\.env")

from app.agents.orchestrator.agent import research_agent


async def main():
    query = "give me a short research of the F1 racing"
    config = {"configurable": {"thread_id": "test-1"}}

    result = await research_agent.ainvoke(
        {"messages": [{"role": "user", "content": query}]},
        config=config,
    )

    for msg in result.get("messages", []):
        if hasattr(msg, "pretty_print"):
            msg.pretty_print()


    print(result.get("messages", [])[-1].content)

asyncio.run(main())