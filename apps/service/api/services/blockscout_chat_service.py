"""
Service for handling Blockscout-based chat interactions.
"""
import asyncio
import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from langchain_mcp_adapters.tools import load_mcp_tools

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
BLOCKSCOUT_MCP_URL: str = "https://mcp.blockscout.com/mcp"


class BlockscoutChatService:
    """Service for managing Blockscout chat interactions."""
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")
        self.llm = None
        self.agent = None
        self.tools = None
        self.system_prompt = """You are Puck, an autonomous and expert blockchain analyst. Your primary goal is to answer the user's questions directly and efficiently. You must act on your own initiative to get the answer.

**DO NOT ask for permission to use a tool.** You are expected to use them proactively.

When you receive a question, you MUST follow this exact process:

1.  **Thought:** First, think step-by-step.
    - Analyze the user's question.
    - If the answer requires on-chain data, identify the single best tool to use from your list.
    - State your plan. This thought process should be enclosed in <thinking> XML tags.

2.  **Action:** After your thought process, if you have decided on a tool, you will immediately call it. The system will handle the tool call based on your plan.

3.  **Final Answer:** After the tool has been executed and you have the data, provide a final, clear, and concise answer to the user. Synthesize the information; do not just output raw JSON.

**CRITICAL INSTRUCTIONS:**
*   **Chain ID Rule:** When a tool requires a `chain_id`, you MUST use the correct numerical ID (e.g., "1" for Ethereum).
*   **Pagination Rule:** If a tool's output mentions more data is available, summarize the first page and inform the user. DO NOT fetch more pages unless asked.
*   **Brevity:** Keep your responses concise and to the point. Avoid unnecessary explanations unless the user asks for details.
"""
    
    async def initialize(self):
        """Initialize the Blockscout connection and tools."""
        if self.agent is not None:
            return  # Already initialized
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=self.google_api_key,
            temperature=0.2
        )
        
        async with streamablehttp_client(url=BLOCKSCOUT_MCP_URL) as (read, write, _):
            async with ClientSession(read, write) as session:
                # Load the tools using the LIVE session
                all_tools = await load_mcp_tools(session)
                self.tools = [t for t in all_tools if t.name != "read_contract"]
                for tool in self.tools:
                    tool._run = lambda *args, **kwargs: asyncio.run(tool._arun(*args, **kwargs))
                
                self.agent = create_agent(
                    model=self.llm,
                    tools=self.tools,
                    system_prompt=self.system_prompt
                )
    
    async def process_message(
        self, 
        message: str, 
        chat_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Process a user message and return a response.
        
        Args:
            message: The user's message
            chat_history: Previous conversation history
            
        Returns:
            The assistant's response
        """
        try:
            # Initialize LLM if needed
            if self.llm is None:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash-exp",
                    google_api_key=self.google_api_key,
                    temperature=0.2
                )
            
            # Build message history
            messages = []
            if chat_history:
                for msg in chat_history:
                    if msg["role"] == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages.append(AIMessage(content=msg["content"]))
            
            # Add current user message
            messages.append(HumanMessage(content=message))
            
            # Process with agent using a fresh session
            final_answer_chunks = []
            all_content = []
            
            async with streamablehttp_client(url=BLOCKSCOUT_MCP_URL) as (read, write, _):
                async with ClientSession(read, write) as session:
                    # Load tools with active session
                    all_tools = await load_mcp_tools(session)
                    tools = [t for t in all_tools if t.name != "read_contract"]
                    for tool in tools:
                        tool._run = lambda *args, **kwargs: asyncio.run(tool._arun(*args, **kwargs))
                    
                    agent = create_agent(
                        model=self.llm,
                        tools=tools,
                        system_prompt=self.system_prompt
                    )
                    
                    # Stream the agent's response and collect the final answer
                    logger.info(f"Starting agent stream for message: {message[:50]}...")
                    async for chunk in agent.astream(
                        {"messages": messages},
                        stream_mode="values"
                    ):
                        latest_message = chunk["messages"][-1]
                        logger.debug(f"Received message type: {type(latest_message).__name__}")
                        
                        # Collect all AIMessage content
                        if isinstance(latest_message, AIMessage):
                            logger.debug(f"AIMessage - has content: {bool(latest_message.content)}, has tool_calls: {bool(latest_message.tool_calls)}")
                            if latest_message.content:
                                # Collect content whether it has tool calls or not
                                content = latest_message.content
                                logger.debug(f"Content preview: {content[:100] if len(content) > 100 else content}")
                                if content not in all_content:
                                    all_content.append(content)
                                    if not latest_message.tool_calls:
                                        # Only add to final answer if it's not a tool call
                                        final_answer_chunks.append(content)
            
            # Join all collected chunks
            final_answer = "".join(final_answer_chunks).strip()
            logger.info(f"Final answer length: {len(final_answer)}")
            logger.debug(f"Final answer preview: {final_answer[:200] if len(final_answer) > 200 else final_answer}")
            
            if not final_answer:
                logger.warning("No final answer collected from agent")
                logger.debug(f"All content collected: {all_content}")
                # If we have any content at all, return it
                if all_content:
                    return "".join(all_content).strip()
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
            
            return final_answer
            
        except Exception as e:
            raise Exception(f"Error processing message: {str(e)}")


# Create a global instance
blockscout_chat_service = BlockscoutChatService()
