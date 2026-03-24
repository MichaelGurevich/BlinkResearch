"""Static Google Gemini model registry used for fallback ordering."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class GoogleModelDefinition:
    """Human-friendly metadata for a Google Gemini model."""

    display_name: str
    model_id: str


AVAILABLE_GOOGLE_MODELS: tuple[GoogleModelDefinition, ...] = (
    GoogleModelDefinition(
        display_name="Gemini 3.1 Pro",
        model_id="gemini-3.1-pro-preview",
    ),
    GoogleModelDefinition(
        display_name="Gemini 3.1 Flash-Lite",
        model_id="gemini-3.1-flash-lite-preview",
    ),
    GoogleModelDefinition(
        display_name="Gemini 3 Flash",
        model_id="gemini-3-flash-preview",
    ),
    GoogleModelDefinition(
        display_name="Gemini 2.5 Pro",
        model_id="gemini-2.5-pro",
    ),
    GoogleModelDefinition(
        display_name="Gemini 2.5 Flash",
        model_id="gemini-2.5-flash",
    ),
    GoogleModelDefinition(
        display_name="Gemini 2.5 Flash-Lite",
        model_id="gemini-2.5-flash-lite",
    ),
)

DEFAULT_GEMINI_MODEL_ID = "gemini-3.1-flash-lite-preview"
GOOGLE_MODEL_IDS: tuple[str, ...] = tuple(model.model_id for model in AVAILABLE_GOOGLE_MODELS)
_GOOGLE_MODELS_BY_ID = {model.model_id: model for model in AVAILABLE_GOOGLE_MODELS}


def get_model_display_name(model_id: str) -> str:
    """Return a user-friendly model name for a known Google model id."""
    model = _GOOGLE_MODELS_BY_ID.get(model_id)
    return model.display_name if model is not None else model_id


def model_exists(model_id: str) -> bool:
    """Return whether the provided model id exists in the local registry."""
    return model_id in _GOOGLE_MODELS_BY_ID


def build_model_sequence(preferred_model_id: str | None = None) -> tuple[str, ...]:
    """Build the ordered fallback sequence for Google Gemini requests."""
    selected_model_id = preferred_model_id or DEFAULT_GEMINI_MODEL_ID

    if selected_model_id not in _GOOGLE_MODELS_BY_ID:
        available = ", ".join(GOOGLE_MODEL_IDS)
        raise ValueError(
            f"Unsupported Google model id '{selected_model_id}'. Available models: {available}"
        )

    return (selected_model_id,) + tuple(
        model_id for model_id in GOOGLE_MODEL_IDS if model_id != selected_model_id
    )
