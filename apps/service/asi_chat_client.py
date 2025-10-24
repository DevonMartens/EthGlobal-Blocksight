"""
ASI:One Chat Client for Natural Language to SQL
Interactive chat interface using ASI:One API
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict
import requests

# Load environment
load_dotenv()

# Configuration
ASI_API_KEY = os.getenv("ASI_API_KEY")
AGENT_API_URL = "http://localhost:8002"

# Initialize ASI:One client with JWT token
if ASI_API_KEY:
    client = OpenAI(
        base_url="https://api.asi1.ai/v1",
        api_key=ASI_API_KEY  # OpenAI client handles Bearer prefix automatically
    )
else:
    client = None
    print("⚠️  Warning: ASI_API_KEY not found. Conversational features will be limited.")

class ASIChatSession:
    """Chat session with conversation history"""
    
    def __init__(self):
        self.history: List[Dict[str, str]] = []
        self.system_prompt = """You are a helpful SQL assistant for blockchain wallet analytics.
You help users understand their database queries and results.
Be concise, friendly, and informative.

Available database tables:
- wallets: Wallet addresses
- token_balances: Token holdings by wallet
- transactions: Blockchain transactions
- nfts: NFT ownership
- protocol_interactions: DeFi protocol usage
- end_users: User information
- client_users: Client accounts
"""
    
    def add_message(self, role: str, content: str):
        """Add message to conversation history"""
        self.history.append({
            "role": role,
            "content": content
        })
    
    def get_sql_from_agent(self, question: str) -> Dict:
        """Get SQL query from local agent"""
        try:
            response = requests.post(
                f"{AGENT_API_URL}/generate_sql",
                json={"question": question},
                timeout=30
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def execute_query(self, question: str) -> Dict:
        """Execute query and get results"""
        try:
            response = requests.post(
                f"{AGENT_API_URL}/query",
                json={"question": question},
                timeout=30
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def chat(self, user_message: str, execute: bool = True) -> str:
        """
        Process user message and return AI response
        
        Args:
            user_message: User's question or command
            execute: Whether to execute queries or just generate SQL
        
        Returns:
            AI assistant's response
        """
        # Add user message to history
        self.add_message("user", user_message)
        
        # Improved query detection - be more specific
        msg_lower = user_message.lower()
        
        # Phrases that clearly indicate SQL queries
        sql_indicators = [
            "how many", "show me", "list all", "list the",
            "count", "sum", "total", "average",
            "top 5", "top 10", "recent", "latest",
            "find all", "get all", "display all"
        ]
        
        # Data-related words
        data_words = [
            "wallet", "transaction", "nft", "user", "balance",
            "token", "protocol", "client", "row", "table"
        ]
        
        # Conversational phrases (NOT queries)
        conversational = [
            "hi", "hello", "hey", "thanks", "thank you",
            "what can you", "who are you", "explain",
            "tell me about", "can you help", "what do you do",
            "how are you", "good morning", "good afternoon"
        ]
        
        # Check if it's conversational first
        is_conversational = any(phrase in msg_lower for phrase in conversational)
        
        # Check if it has SQL indicators AND data words
        has_sql_indicator = any(ind in msg_lower for ind in sql_indicators)
        has_data_word = any(word in msg_lower for word in data_words)
        
        # It's a query ONLY if:
        # - Has SQL indicators AND data words
        # - AND is NOT conversational
        is_query = has_sql_indicator and has_data_word and not is_conversational
        
        if is_query:
            # Get SQL and possibly execute
            if execute:
                result = self.execute_query(user_message)
            else:
                result = self.get_sql_from_agent(user_message)
            
            # Check for errors
            if "error" in result:
                response = f"❌ Error: {result['error']}"
                self.add_message("assistant", response)
                return response
            
            # Format response with SQL
            if execute and "answer" in result:
                # Full execution with NL answer
                response = f"""📊 **Query Results**

🔍 **SQL Generated:**
```sql
{result.get('sql', 'N/A')}
```

💡 **Answer:**
{result.get('answer', 'No answer available')}

📈 **Details:** {result.get('rows_returned', 0)} rows returned
"""
            else:
                # Just SQL generation
                response = f"""🔍 **SQL Generated:**
```sql
{result.get('sql', 'N/A')}
```

💡 Would you like me to execute this query?
"""
            
            self.add_message("assistant", response)
            return response
        
        else:
            # General conversation using ASI:One
            messages = [
                {"role": "system", "content": self.system_prompt},
                *self.history
            ]
            
            try:
                response = client.chat.completions.create(
                    model="asi1-mini",
                    messages=messages,
                    max_tokens=500
                )
                
                ai_response = response.choices[0].message.content
                self.add_message("assistant", ai_response)
                return ai_response
                
            except Exception as e:
                error_msg = f"❌ ASI:One API Error: {str(e)}"
                self.add_message("assistant", error_msg)
                return error_msg
    
    def clear_history(self):
        """Clear conversation history"""
        self.history = []
    
    def show_history(self):
        """Display conversation history"""
        print("\n" + "="*70)
        print("📜 CONVERSATION HISTORY")
        print("="*70)
        for i, msg in enumerate(self.history, 1):
            role = "👤 You" if msg["role"] == "user" else "🤖 Assistant"
            print(f"\n{role} (Message {i}):")
            print(msg["content"])
        print("="*70 + "\n")


def main():
    """Interactive chat interface"""
    print("\n" + "="*70)
    print("💬 ASI:One Chat Interface - Blockchain SQL Assistant")
    print("="*70)
    print("\nWelcome! I can help you query blockchain data using natural language.")
    print("\nCommands:")
    print("  • Type your question naturally")
    print("  • 'history' - Show conversation history")
    print("  • 'clear' - Clear conversation history")
    print("  • 'sql only' - Generate SQL without executing")
    print("  • 'exit' or 'quit' - End session")
    print("\n" + "="*70 + "\n")
    
    # Check if agent is running
    try:
        health = requests.get(f"{AGENT_API_URL}/", timeout=5)
        print("✅ Agent connected!")
        print(f"📊 Database: {'Connected' if health.json().get('database_connected') else 'Not connected'}")
        print()
    except:
        print("⚠️  Warning: Local agent not responding at", AGENT_API_URL)
        print("   Make sure to run: python lib/asi_agent.py")
        print()
    
    # Initialize chat session
    session = ASIChatSession()
    sql_only_mode = False
    
    # Chat loop
    while True:
        try:
            # Get user input
            user_input = input("👤 You: ").strip()
            
            if not user_input:
                continue
            
            # Handle commands
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("\n👋 Goodbye! Thanks for using ASI:One Chat!")
                break
            
            elif user_input.lower() == 'history':
                session.show_history()
                continue
            
            elif user_input.lower() == 'clear':
                session.clear_history()
                print("✅ Conversation history cleared!\n")
                continue
            
            elif user_input.lower() == 'sql only':
                sql_only_mode = not sql_only_mode
                mode = "SQL generation only" if sql_only_mode else "Full execution"
                print(f"✅ Mode switched to: {mode}\n")
                continue
            
            # Process message
            print("\n🤖 Assistant: ", end="")
            response = session.chat(user_input, execute=not sql_only_mode)
            print(response)
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 Chat interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()

