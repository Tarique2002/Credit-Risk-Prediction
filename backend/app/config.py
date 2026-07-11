import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./credit_risk.db"
    
    # JWT Auth Settings
    JWT_SECRET: str
    JWT_REFRESH_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Machine Learning Settings
    MODEL_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "ml", "artifacts"))
    AUTO_TRAIN_ON_STARTUP: bool = True
    
    # Gemini API Settings
    GEMINI_API_KEY: Optional[str] = None
    
    # SMTP Notification Settings
    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 2525
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "no-reply@creditriskplatform.com"
    
    # Cache Settings
    REDIS_URL: Optional[str] = None

    # Load from root-level .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Resolve relative MODEL_DIR relative to backend root directory
if not os.path.isabs(settings.MODEL_DIR):
    settings.MODEL_DIR = os.path.abspath(os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        settings.MODEL_DIR
    ))

