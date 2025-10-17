"""
Configuration module for managing environment variables and app settings.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Google Gemini API Configuration
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "True").lower() == "true"
    
    # App Metadata
    APP_NAME: str = "NL to SQL Query Service"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Natural Language to SQL Query API using Google Gemini"
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """Validate that required settings are present."""
        if not self.DATABASE_URL:
            return False, "DATABASE_URL is not set in environment variables"
        if not self.GOOGLE_API_KEY:
            return False, "GOOGLE_API_KEY is not set in environment variables"
        return True, None


# Create a global settings instance
settings = Settings()

