import asyncio
import os
from dotenv import load_dotenv
from typing import List

from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from langchain_mcp_adapters.tools import load_mcp_tools

load_dotenv()

# --- Configuration ---
BLOCKSCOUT_MCP_URL: str = "https://mcp.blockscout.com/mcp"
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")


async def main():
    """
    The main function that now handles the connection lifecycle and the conversational loop.
    """
    print("Initializing Puck...")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.2
    )

    system_prompt = """You are Puck, an autonomous and expert blockchain analyst. Your primary goal is to answer the user's questions directly and efficiently. You must act on your own initiative to get the answer.

**DO NOT ask for permission to use a tool.** You are expected to use them proactively.

When you receive a question, you MUST follow this exact process:

1.  **Thought:** First, think step-by-step.
    - Analyze the user's question.
    - If the answer requires on-chain data, identify the single best tool to use from your list.
    - State your plan. This thought process should be enclosed in <thinking> XML tags.

2.  **Action:** After your thought process, if you have decided on a tool, you will immediately call it. The system will handle the tool call based on your plan.

3.  **Final Answer:** After the tool has been executed and you have the data, provide a final, clear, and concise answer to the user. Synthesize the information; do not just output raw JSON.

---
**EXAMPLE:**

    User: How many chains do you support?

Puck's Response:
<thinking>
The user is asking about the number of supported chains. I have a tool called `get_chains_list` that can provide this information. This tool requires no parameters. My plan is to call this tool and then count the number of chains in the result to answer the user.
</thinking>
*(...tool call to get_chains_list happens here...)*
Based on the data I just retrieved, I support 18 different blockchains, including major ones like Ethereum, Polygon, and Gnosis.
---

**CRITICAL INSTRUCTIONS:**
*   **Chain ID Rule:** When a tool requires a `chain_id`, you MUST use the correct numerical ID (e.g., "1" for Ethereum).
*   **Pagination Rule:** If a tool's output mentions more data is available, summarize the first page and inform the user. DO NOT fetch more pages unless asked.
"""
    
    async with streamablehttp_client(url=BLOCKSCOUT_MCP_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            print("Connection successful.")
            
            # Load the tools using the LIVE session
            all_tools = await load_mcp_tools(session)
            tools = [t for t in all_tools if t.name != "read_contract"]
            for tool in tools:
                tool._run = lambda *args, **kwargs: asyncio.run(tool._arun(*args, **kwargs))
            
            print(f"✅ Puck is connected and has {len(tools)} tools ready.")

            agent = create_agent(model=llm, tools=tools, system_prompt=system_prompt)
            chat_history: List[HumanMessage | AIMessage | ToolMessage] = []

            print("\n--- Puck: Your Blockchain Analyst ---")
            print("Ask me anything about blockchain data, or type 'exit' to quit.")

            while True:
                try:
                    user_input = input("\nYou: ")
                    if user_input.lower() == 'exit':
                        print("Puck: Goodbye!")
                        break

                    print("\nPuck:")
                    
                    messages_for_agent = chat_history + [HumanMessage(content=user_input)]
                    
                    final_answer_chunks = []
                    tool_calls = []
                    final_answer = ""
                    
                    # Stream the agent's response
                    async for chunk in agent.astream(
                        {"messages": messages_for_agent},
                        stream_mode="values"
                    ):
                        latest_message = chunk["messages"][-1]

                        if isinstance(latest_message, AIMessage) and latest_message.tool_calls:
                            if latest_message.tool_calls != tool_calls:
                                print(f"🛠️ Using tool `{latest_message.tool_calls[0]['name']}`...")
                                tool_calls = latest_message.tool_calls
                        elif isinstance(latest_message, ToolMessage):
                            print(f"✅ Tool `{latest_message.name}` finished.")
                            print(f"🧠 Thinking...")
                        elif isinstance(latest_message, AIMessage) and latest_message.content:
                            final_answer_chunks.append(latest_message.content)
                            print(latest_message.content, end="", flush=True)

                    final_answer = "".join(final_answer_chunks)
                    
                    chat_history.clear()
                    chat_history.extend(chunk["messages"])

                except Exception as e:
                    print(f"\n\nAn error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())