import os
from django.conf import settings
from google import genai
from rest_framework.exceptions import ValidationError

_client = None

PRIMARY_MODEL = "gemini-3.8-flash"
FALLBACK_MODEL = "gemini-3.5-flash-lite"
MODELS_CASCADE = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


def get_gemini_client() -> genai.Client:
    """Returns a singleton instance of the Google GenAI client initialized with the project's API key."""
    global _client
    if _client is not None:
        return _client

    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        api_key = (
            os.environ.get("GEMINI_API_KEY", "")
            or os.environ.get("GOOGLE_API_KEY", "")
            or os.environ.get("VITE_GEMINI_API_KEY", "")
        )

    api_key = (api_key or "").strip()
    if not api_key:
        raise ValidationError(
            "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY in your environment."
        )

    _client = genai.Client(api_key=api_key)
    return _client
