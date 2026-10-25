"""Configuration for the internal ML/LLM service."""

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
  """Runtime settings read from environment variables."""

  model_path: Path
  internal_api_key: str
  ollama_api_key: str
  ollama_base_url: str
  ollama_model: str
  llm_timeout_seconds: float
  llm_max_retries: int


def _require(name: str) -> str:
  value = os.getenv(name, "").strip()
  if not value:
    raise RuntimeError(f"Environment variable {name} is required")
  return value


def load_settings() -> Settings:
  return Settings(
    model_path=Path(os.getenv("MODEL_PATH", "classification.cbm")),
    internal_api_key=_require("INTERNAL_API_KEY"),
    ollama_api_key=_require("OLLAMA_CLOUD_API_KEY"),
    ollama_base_url=os.getenv("OLLAMA_BASE_URL", "https://ollama.com/v1"),
    ollama_model=os.getenv("OLLAMA_MODEL", "gpt-oss:20b"),
    llm_timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "30")),
    llm_max_retries=int(os.getenv("LLM_MAX_RETRIES", "0")),
  )


settings = load_settings()
