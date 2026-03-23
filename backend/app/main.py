from fastapi import FastAPI
from pydantic import BaseModel
import uuid
import os
from dotenv import load_dotenv

# Load the keys from the .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from agents.graph import research_agent

app = FastAPI(title="Deep Research Agent API")

class ResearchRequest(BaseModel):
    query: str
    thread_id: str | None = None

class ResearchResponse(BaseModel):
    response: str
    thread_id: str

@app.post("/api/research", response_model=ResearchResponse)
async def start_research(request: ResearchRequest):
    thread_id = request.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    import json
    
    # We invoke the agent with the user's initial query and stream updates to the console
    try:
        print(f"\n🚀 Starting research for thread: {thread_id}")
        print(f"🔍 Query: {request.query}\n")
        
        final_messages = []
        
        # Stream updates from the graph to see exactly what each node/agent is doing
        async for chunk in research_agent.astream(
            {"messages": [{"role": "user", "content": request.query}]},
            config=config,
            stream_mode="updates"
        ):
            for node_name, node_state in chunk.items():
                print(f"\n{'='*60}")
                print(f"🟢 [Node: {node_name}] Executed")
                print(f"{'='*60}")
                
                if not isinstance(node_state, dict):
                    continue
                    
                if "messages" in node_state:
                    print("\n💬 Messages:")
                    # Collect messages to get the final response at the end
                    messages = node_state["messages"]
                    # LangGraph might return a single message or a list in updates
                    if not isinstance(messages, list):
                        messages = [messages]
                        
                    final_messages.extend(messages)
                    
                    for msg in messages:
                        try:
                            msg.pretty_print()
                        except AttributeError:
                            print(msg)
                
                if "todos" in node_state:
                    print("\n📋 Todos Updated:")
                    print(json.dumps(node_state["todos"], indent=2))
                    
                if "files" in node_state:
                    print("\n📁 Virtual File System Updates:")
                    for filename in node_state["files"].keys():
                        print(f"  - {filename}")
                        
            print(f"{'-'*60}\n")
            
        final_message = final_messages[-1].content if final_messages else "No response"

    except Exception as e:
        print(f"\n⚠️ Error during async streaming via astream: {e}. Falling back to sync invoke...")
        # Fallback to sync invoke if ainvoke/astream isn't available or fails
        import asyncio
        result = await asyncio.to_thread(
            research_agent.invoke,
            {"messages": [{"role": "user", "content": request.query}]},
            config=config
        )
        final_message = result.get("messages", [])[-1].content if result.get("messages") else "No response"

    # Output the final assistant message
    return ResearchResponse(response=final_message, thread_id=thread_id)

@app.get("/health")
def health_check():
    return {"status": "ok"}