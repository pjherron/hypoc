from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_dsn: str = "postgresql://postgres:postgres@localhost:5432/hypoc"
    redis_url: str = "redis://localhost:6379/2"

    # Tier 1 — Local (Ollama)
    ollama_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3"

    # Tier 2 — Self-hosted
    self_hosted_url: str = "http://localhost:8080/v1"
    self_hosted_api_key: str = "none"
    self_hosted_model: str = "mistral"

    # Tier 3 — GitHub Copilot
    copilot_url: str = "https://api.githubcopilot.com/v1"
    copilot_api_key: str = "${GITHUB_COPILOT_TOKEN}"
    copilot_model: str = "gpt-4o"

    # Tier 4 — Premium (Anthropic)
    anthropic_api_key: str = "${ANTHROPIC_API_KEY}"
    premium_model: str = "claude-sonnet-5"

    class Config:
        env_file = ".env"


settings = Settings()
