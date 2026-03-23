import os
import time

from langchain_core.callbacks import BaseCallbackHandler, StdOutCallbackHandler
from langchain_google_genai import ChatGoogleGenerativeAI
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler


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

summarization_model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    api_key=os.getenv("GEMINI_KEY", ""),
    callbacks=[langfuse_handler, stdout_handler, delay_handler],
)





