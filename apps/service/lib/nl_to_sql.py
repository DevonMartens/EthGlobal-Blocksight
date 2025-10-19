import os
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain.chains import create_sql_query_chain
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from openai import APIError, Timeout

# --- Configuration ---
load_dotenv()

if 'OPENROUTER_API_KEY' not in os.environ:
    print("ERROR: OPENROUTER_API_KEY not found in environment variables.")
    exit()

# --- 1. Set up the Language Model (LLM) with OpenRouter ---
llm = ChatOpenAI(
    model="meta-llama/llama-3.1-8b-instruct",
    temperature=0,
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# --- 2. Connect to the Database ---
db_uri = "sqlite:///nl_to_sql.db"
if not os.path.exists(db_uri.replace("sqlite:///", "")):
    print(f"ERROR: Database file '{db_uri.replace('sqlite:///', '')}' not found.")
    print("Please run 'python preprocess_data.py' first to create and populate it.")
    exit()

db = SQLDatabase.from_uri(db_uri)
print(f"-> Successfully connected to database: {db_uri}")

sql_query_chain = create_sql_query_chain(llm, db)


@retry(
    wait=wait_fixed(2),  
    stop=stop_after_attempt(3),  
    retry=retry_if_exception_type((APIError, Timeout)) 
)
def generate_sql_from_question(question: str) -> str:
    """
    Takes a user's natural language question, generates a SQL query, and returns it.
    Includes a retry mechanism for API calls.
    """
    print(f"\n-> Generating SQL for question: '{question}'")
    try:
        sql_query = sql_query_chain.invoke({"question": question})
        return sql_query.strip().replace("```sql", "").replace("```", "").strip()
    except (APIError, Timeout) as e:
        print(f"An API error occurred. Retrying... Error: {e}")
        raise 
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return "Error: Could not generate SQL query due to an unexpected issue."


# --- Manuall Test Case  ---
if __name__ == "__main__":
    print("--- Natural Language to SQL Query Generator ---")
    
    query1 = "How many NFTs does the wallet own in total?"
    generated_sql1 = generate_sql_from_question(query1)
    print("\n[Generated SQL 1]")
    print(generated_sql1)
    
    print("\n" + "="*50)
    
    query2 = "List the top 5 transactions by block number."
    generated_sql2 = generate_sql_from_question(query2)
    print("\n[Generated SQL 2]")
    print(generated_sql2)

    print("\n" + "="*50)

    query3 = "What are the contract addresses for all the token balances?"
    generated_sql3 = generate_sql_from_question(query3)
    print("\n[Generated SQL 3]")
    print(generated_sql3)