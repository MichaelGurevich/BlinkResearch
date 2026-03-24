"""Google Gemini model registry and fallback-aware chat model exports."""

from .chat_model import (
    GoogleModelFallbackChatModel,
    GoogleModelFallbackExhaustedError,
    build_google_model_fallback_chat_model,
    disable_google_model,
    get_disabled_google_models,
    reset_disabled_google_models,
    should_switch_google_model,
)
from .models import (
    AVAILABLE_GOOGLE_MODELS,
    DEFAULT_GEMINI_MODEL_ID,
    GOOGLE_MODEL_IDS,
    GoogleModelDefinition,
    build_model_sequence,
    get_model_display_name,
)

__all__ = [
    "AVAILABLE_GOOGLE_MODELS",
    "DEFAULT_GEMINI_MODEL_ID",
    "GOOGLE_MODEL_IDS",
    "GoogleModelDefinition",
    "GoogleModelFallbackChatModel",
    "GoogleModelFallbackExhaustedError",
    "build_google_model_fallback_chat_model",
    "disable_google_model",
    "build_model_sequence",
    "get_disabled_google_models",
    "get_model_display_name",
    "reset_disabled_google_models",
    "should_switch_google_model",
]
