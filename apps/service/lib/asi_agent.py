"""
ASI Agent: 100% ASI:One Integration
Uses ASI:One API for ALL AI operations (SQL generation AND answer generation)
"""

import os
import re
import threading
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

# Import uagents
try:
    from uagents import Agent, Context, Protocol
    UAGENTS_AVAILABLE = True
    print("✅ uagents imported successfully")
except ImportError as e:
    print(f"⚠️  uagents not installed: {e}")
    Agent = None
    Context = None
    Protocol = None
    UAGENTS_AVAILABLE = False

# Try chat protocol
if UAGENTS_AVAILABLE:
    try:
        from uagents_core.contrib.protocols.chat import (
            ChatMessage, ChatAcknowledgement, TextContent, EndSessionContent, chat_protocol_spec
        )
        CHAT_PROTOCOL_AVAILABLE = True
        print("✅ Chat protocol imported successfully")
    except ImportError as e:
        print(f"⚠️  Chat protocol not available: {e}")
        CHAT_PROTOCOL_AVAILABLE = False
        ChatMessage = None
        ChatAcknowledgement = None
        TextContent = None
        EndSessionContent = None
        chat_protocol_spec = None
else:
    CHAT_PROTOCOL_AVAILABLE = False

from openai import OpenAI
from langchain_community.utilities import SQLDatabase
from dotenv import load_dotenv
import pandas as pd

# ============================================================
# CONFIGURATION
# ============================================================
load_dotenv()

ASI_API_KEY = os.getenv("ASI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8001"))
SEED_PHRASE = os.getenv("AGENT_SEED", "demo-seed-phrase")

if not ASI_API_KEY:
    print("ERROR: ASI_API_KEY is required for ASI:One integration.")
    exit(1)

# ============================================================
# DATABASE CONNECTION
# ============================================================
db = None
if DATABASE_URL:
    try:
        db = SQLDatabase.from_uri(DATABASE_URL)
        print(f"✅ Connected to database: {db.dialect}")
        print(f"📊 Available Tables: {db.get_usable_table_names()}")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")

# ============================================================
# ASI:ONE CLIENT (For ALL AI Operations)
# ============================================================
if not ASI_API_KEY:
    print("ERROR: ASI_API_KEY not found in environment")
    print("Get your key from: https://agentverse.ai/")
    exit(1)

# ASI:One uses JWT tokens from Agentverse
# The OpenAI client adds 'Bearer' prefix automatically, so just pass the token
asi_client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=ASI_API_KEY  # Pass JWT token directly - OpenAI client handles the Bearer prefix
)
print(f"✅ ASI:One client initialized (using asi1-mini model)")
print(f"🔑 JWT Token: {ASI_API_KEY[:20]}...{ASI_API_KEY[-20:]}")

# ============================================================
# AGENT INITIALIZATION
# ============================================================
agent = None
if Agent is not None and UAGENTS_AVAILABLE:
    try:
        agent = Agent(
            name="nl_to_sql_wallet_agent",
            seed=SEED_PHRASE,
            port=AGENT_PORT,
            mailbox=True,
            publish_agent_details=True,
        )
        print(f"🤖 Agent created: {agent.name}")
        print(f"📬 Agent address: {agent.address}")
    except Exception as e:
        print(f"⚠️  Failed to create agent: {e}")
        agent = None
else:
    print("⚠️  uagents not available. Running in REST API mode only.")

# ============================================================
# SQL GENERATION USING ASI:ONE
# ============================================================

def generate_sql_from_nl_asi(question: str, db: SQLDatabase) -> str:
    """Generate SQL query using ASI:One API"""
    table_info = db.get_usable_table_names() if db else [
        "wallets", "token_balances", "transactions", "nfts", "protocol_interactions"
    ]
    
    system_prompt = f"""You are a PostgreSQL expert. Generate ONLY valid SQL queries.

Available Tables: {table_info}
{f"Table Structure: {db.table_info[:500]}" if db else ""}

Rules:
- Generate ONLY the SQL query, no explanations
- Use proper PostgreSQL syntax
- No markdown formatting
- No comments
- Just the query"""

    try:
        response = asi_client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate SQL for: {question}"}
            ],
            max_tokens=512,
            temperature=0
        )
        
        sql_query = response.choices[0].message.content.strip()
        # Clean up any markdown
        sql_query = re.sub(r"```sql|```", "", sql_query, flags=re.IGNORECASE).strip()
        return sql_query
    except Exception as e:
        print(f"❌ Error generating SQL with ASI:One: {e}")
        return f"-- Error: {str(e)}"


def execute_generated_sql(sql_query: str, db: SQLDatabase) -> pd.DataFrame:
    """Execute SQL query on database"""
    if not db:
        raise Exception("Database not connected")
    
    try:
        result = db.run(sql_query)
        df = pd.DataFrame(result) if isinstance(result, list) else pd.DataFrame([result])
        return df
    except Exception as e:
        raise Exception(f"Error executing SQL: {str(e)}")


def generate_nl_answer_asi(question: str, sql: str, results: pd.DataFrame) -> str:
    """Generate natural language answer using ASI:One"""
    system_prompt = """You are a helpful assistant that explains database query results.
Given a question, SQL query, and results, provide a clear, concise natural language answer.
Be friendly and informative."""

    user_prompt = f"""Question: {question}

SQL Query: {sql}

Results ({len(results)} rows):
{results.to_string(index=False)}

Provide a clear, natural language answer to the original question based on these results."""

    try:
        response = asi_client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error generating answer: {str(e)}"


def answer_user_question(question: str, db: SQLDatabase) -> dict:
    """Full pipeline using ASI:One for everything"""
    # Step 1: Generate SQL using ASI:One
    sql_query = generate_sql_from_nl_asi(question, db)
    
    if not db:
        return {
            "sql": sql_query,
            "result": None,
            "answer": "Database not connected. SQL query generated but not executed."
        }
    
    try:
        # Step 2: Execute query
        sql_result = execute_generated_sql(sql_query, db)
        
        # Step 3: Generate NL answer using ASI:One
        answer = generate_nl_answer_asi(question, sql_query, sql_result)
        
        return {
            "sql": sql_query,
            "result": sql_result.to_dict('records'),
            "answer": answer
        }
    except Exception as e:
        return {
            "sql": sql_query,
            "result": None,
            "answer": f"Error executing query: {str(e)}"
        }

# ============================================================
# UAGENT CHAT PROTOCOL
# ============================================================
if agent is not None and CHAT_PROTOCOL_AVAILABLE:
    try:
        chat_proto = Protocol(spec=chat_protocol_spec)

        @chat_proto.on_message(model=ChatMessage)
        async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
            """Handle incoming chat messages"""
            ctx.logger.info(f"📨 Received message from {sender}")
            
            ack = ChatAcknowledgement(
                timestamp=ctx.now(),
                acknowledged_msg_id=msg.msg_id
            )
            await ctx.send(sender, ack)

            user_text = ""
            for content_item in msg.content:
                if isinstance(content_item, TextContent):
                    user_text += content_item.text + " "
            
            user_text = user_text.strip()
            ctx.logger.info(f"📝 Question: {user_text}")

            try:
                result = answer_user_question(user_text, db)
                
                response_text = f"🔍 SQL Query:\n```sql\n{result['sql']}\n```\n\n"
                
                if result['result'] is not None:
                    response_text += f"📊 Results: {len(result['result'])} rows returned\n\n"
                
                response_text += f"💡 Answer:\n{result['answer']}"
                
                ctx.logger.info(f"✅ Generated response")
            except Exception as e:
                ctx.logger.error(f"❌ Error: {e}")
                response_text = f"❌ Error: {str(e)}"

            response_content = [
                TextContent(type="text", text=response_text),
                EndSessionContent(type="end-session")
            ]
            
            response_msg = ChatMessage(
                timestamp=ctx.now(),
                msg_id=ctx.new_msg_id(),
                content=response_content
            )
            
            await ctx.send(sender, response_msg)

        agent.include(chat_proto, publish_manifest=False)
        print("✅ Chat protocol registered successfully")
    except Exception as e:
        print(f"⚠️  Could not register chat protocol: {e}")

# ============================================================
# AGENT RUNNER
# ============================================================
def run_agent():
    if agent is not None:
        print("🚀 Starting uAgent...")
        agent.run()

# ============================================================
# REST API
# ============================================================
app = FastAPI(
    title="ASI-Powered SQL Agent",
    description="Natural Language to SQL using ASI:One API",
    version="2.0.0"
)

class QueryRequest(BaseModel):
    question: str

class SQLGenerationResponse(BaseModel):
    sql: str
    question: str

class FullQueryResponse(BaseModel):
    question: str
    sql: str
    result: Optional[list] = None
    answer: str
    rows_returned: Optional[int] = None

@app.get("/")
async def root():
    return {
        "status": "running",
        "agent_name": agent.name if agent else "No agent (REST API only)",
        "agent_address": agent.address if agent else None,
        "agent_enabled": agent is not None,
        "database_connected": db is not None,
        "ai_provider": "ASI:One (asi1-mini)",
        "available_tables": db.get_usable_table_names() if db else None
    }

@app.post("/generate_sql", response_model=SQLGenerationResponse)
async def generate_sql_endpoint(req: QueryRequest):
    """Generate SQL using ASI:One"""
    try:
        sql = generate_sql_from_nl_asi(req.question, db)
        return SQLGenerationResponse(sql=sql, question=req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=FullQueryResponse)
async def full_query_endpoint(req: QueryRequest):
    """Full pipeline with ASI:One"""
    if not db:
        raise HTTPException(
            status_code=503,
            detail="Database not connected"
        )
    
    try:
        result = answer_user_question(req.question, db)
        
        return FullQueryResponse(
            question=req.question,
            sql=result['sql'],
            result=result['result'],
            answer=result['answer'],
            rows_returned=len(result['result']) if result['result'] else 0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("\n" + "="*70)
    print("🌟 ASI Agent: 100% ASI:One Powered")
    print("="*70)
    if agent:
        print(f"🤖 Agent Name: {agent.name}")
        print(f"📬 Agent Address: {agent.address}")
        print(f"🔌 uAgent Port: {AGENT_PORT}")
    else:
        print(f"🤖 Agent: Disabled (REST API mode only)")
    print(f"🌐 REST API Port: {AGENT_PORT + 1}")
    print(f"💾 Database: {'Connected ✅' if db else 'Not Connected ⚠️'}")
    print(f"🤖 AI Provider: ASI:One (asi1-mini model)")
    print("="*70 + "\n")
    
    if agent is not None:
        agent_thread = threading.Thread(target=run_agent, daemon=True)
        agent_thread.start()
    
    print(f"🚀 Starting REST API on http://0.0.0.0:{AGENT_PORT + 1}")
    print(f"📖 API Docs: http://localhost:{AGENT_PORT + 1}/docs\n")
    
    uvicorn.run(app, host="0.0.0.0", port=AGENT_PORT + 1)

