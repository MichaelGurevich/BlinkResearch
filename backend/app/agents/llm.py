import os
import time

from dotenv import load_dotenv
from langchain_core.callbacks import BaseCallbackHandler, StdOutCallbackHandler
from langchain_google_genai import ChatGoogleGenerativeAI
from langfuse.langchain import CallbackHandler as LangfuseCallbackHandler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))


class RateLimitDelayHandler(BaseCallbackHandler):
    """Wait 2 seconds before every LLM call to avoid 429 errors."""

    def on_llm_start(self, serialized, prompts, **kwargs):
        time.sleep(2)

stdout_handler = StdOutCallbackHandler()
delay_handler = RateLimitDelayHandler()
callbacks = [stdout_handler, delay_handler]

if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
    callbacks.insert(0, LangfuseCallbackHandler())

gemini_api_key = (
    os.getenv("GEMINI_API_KEY")
    or os.getenv("GOOGLE_API_KEY")
    or os.getenv("GEMINI_KEY", "")
)

model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    api_key=gemini_api_key,
    callbacks=callbacks,
)

summarization_model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    api_key=gemini_api_key,
    callbacks=callbacks,
)

