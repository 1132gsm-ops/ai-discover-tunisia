from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 5432
    DB_NAME: str = "aidt_db"
    DB_USER: str = "aidt_user"
    DB_PASSWORD: str
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    OPENROUTER_API_KEY: str = ""
    N8N_WEBHOOK_URL: str = ""
    JWT_SECRET: str = ""
    ADMIN_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
