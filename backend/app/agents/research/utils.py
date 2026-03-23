"""Utility helpers specific to the research sub-agent."""

import time
from datetime import datetime

from langchain_core.callbacks import BaseCallbackHandler


def get_today_str() -> str:
    """Get current date in a human-readable format."""
    return datetime.now().strftime("%a %b %#d, %Y")


class RateLimitDelayHandler(BaseCallbackHandler):
    """Wait 2 seconds before every LLM call to avoid 429 errors."""

    def on_llm_start(self, serialized, prompts, **kwargs):
        time.sleep(2)
