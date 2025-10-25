"""
API routes for Blockscout chat endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from api.services.blockscout_chat_service import blockscout_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatMessage(BaseModel):
    """Model for a chat message."""
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str = Field(..., description="User's message to the blockchain assistant")
    chat_history: List[ChatMessage] = Field(
        default_factory=list,
        description="Previous chat messages for context"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How many chains do you support?",
                "chat_history": []
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat messages."""
    success: bool
    response: str | None = None
    error: str | None = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "response": "I support 18 different blockchains, including Ethereum, Polygon, and Gnosis.",
                "error": None
            }
        }


@router.post("/chat", response_model=ChatResponse)
async def chat_with_blockscout(request: ChatRequest) -> ChatResponse:
    """
    Chat with the blockchain using Blockscout integration.
    
    This endpoint:
    1. Takes a user message and optional chat history
    2. Processes the query using Blockscout's blockchain data
    3. Returns a natural language response
    
    Args:
        request: ChatRequest containing the message and chat history
        
    Returns:
        ChatResponse with the assistant's response
    """
    try:
        logger.info(f"Received chat request: {request.message[:50]}...")
        response = await blockscout_chat_service.process_message(
            message=request.message,
            chat_history=[msg.model_dump() for msg in request.chat_history]
        )
        logger.info(f"Generated response length: {len(response) if response else 0}")
        logger.debug(f"Response preview: {response[:100] if response and len(response) > 100 else response}")
        return ChatResponse(success=True, response=response)
    except Exception as e:
        logger.error(f"Chat processing error: {str(e)}", exc_info=True)
        error_msg = f"Chat processing failed: {str(e)}"
        return ChatResponse(success=False, error=error_msg)


@router.get("/chat/health")
async def chat_health_check() -> Dict[str, str]:
    """
    Health check endpoint for the chat service.
    
    Returns:
        Simple status message
    """
    return {"status": "healthy", "service": "blockscout-chat"}
