"""
API routes for natural language query endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List

from api.services.nl_query_service import nl_query_service

router = APIRouter(prefix="/api/v1", tags=["queries"])


class QueryRequest(BaseModel):
    """Request model for natural language queries."""
    question: str = Field(..., description="Natural language question about the database")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "List all verified client companies."
            }
        }


class QueryResponse(BaseModel):
    """Response model for query results."""
    success: bool
    question: str
    sql_query: str | None = None
    result: List[Dict[str, Any]] | None = None
    answer: str | None = None
    error: str | None = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "question": "List all verified client companies.",
                "sql_query": "SELECT * FROM clients WHERE verified = true;",
                "result": [
                    {"id": 1, "company_name": "Acme Corp", "verified": True}
                ],
                "answer": "There is 1 verified client company: Acme Corp."
            }
        }


class DatabaseInfoResponse(BaseModel):
    """Response model for database information."""
    connected: bool
    dialect: str | None = None
    tables: List[str] | None = None
    error: str | None = None


@router.post("/query", response_model=QueryResponse)
async def execute_natural_language_query(request: QueryRequest) -> QueryResponse:
    """
    Execute a natural language query against the database.
    
    This endpoint:
    1. Converts the natural language question to SQL using Google Gemini
    2. Executes the SQL query against the connected database
    3. Returns both the raw results and a natural language answer
    
    Args:
        request: QueryRequest containing the natural language question
        
    Returns:
        QueryResponse with SQL query, results, and natural language answer
    """
    try:
        result = nl_query_service.answer_user_question(request.question)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


@router.get("/database/info", response_model=DatabaseInfoResponse)
async def get_database_info() -> DatabaseInfoResponse:
    """
    Get information about the connected database.
    
    Returns:
        DatabaseInfoResponse with connection status, dialect, and available tables
    """
    try:
        info = nl_query_service.get_database_info()
        return DatabaseInfoResponse(**info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get database info: {str(e)}")


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint to verify the service is running.
    
    Returns:
        Simple status message
    """
    return {"status": "healthy", "service": "nl-to-sql-api"}

