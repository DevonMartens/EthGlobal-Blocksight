"""
Simple runner script for the NL to SQL API.
Run this from the apps/service directory: python run.py
"""
import uvicorn
from api.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'Not configured'}")
    print(f"📚 API Docs: http://{settings.API_HOST}:{settings.API_PORT}/docs")
    print(f"🔍 Health Check: http://{settings.API_HOST}:{settings.API_PORT}/api/v1/health")
    print("\nPress CTRL+C to stop the server\n")
    
    uvicorn.run(
        "api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )

