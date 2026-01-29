from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator
import sys
import os

class Settings(BaseSettings):
    # MT5
    mt5_path: str = "C:\\Program Files\\MetaTrader 5\\terminal64.exe"
    mt5_timeout: int = 30
    mt5_pool_size: int = 3
    
    # Security (required)
    webhook_secret: str
    api_secret_key: str
    jwt_secret: str
    encryption_key: str
    
    @field_validator('webhook_secret', 'api_secret_key', 'jwt_secret', 'encryption_key')
    @classmethod
    def validate_security_keys(cls, v, info):
        if not v or len(v) < 32:
            raise ValueError(f'{info.field_name} must be at least 32 characters long')
        return v
    
    # API
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Database
    database_url: str = "sqlite:///./brymix.db"
    
    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

try:
    settings = Settings()
except Exception as e:
    print(f"Configuration Error: {e}")
    print("\nRequired environment variables:")
    print("- WEBHOOK_SECRET (min 32 chars)")
    print("- API_SECRET_KEY (min 32 chars)")
    print("- JWT_SECRET (min 32 chars)")
    print("- ENCRYPTION_KEY (min 32 chars)")
    print("\nCreate a .env file with these values.")
    sys.exit(1)
