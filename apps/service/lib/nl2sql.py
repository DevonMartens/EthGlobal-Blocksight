# ============================================================
# 1️⃣ INSTALL REQUIRED LIBRARIES (Uncomment in Colab if needed)
# ============================================================
# !pip install -q langchain langchain-google-genai psycopg2-binary langchain-community pandas

# ============================================================
# 2️⃣ IMPORTS
# ============================================================
import os
import re
import pandas as pd
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ============================================================
# 3️⃣ DATABASE CONNECTION
# ============================================================
DATABASE_URL = "postgresql://postgres:blocksight%4011@34.67.170.55:5432/blocksight"
db = SQLDatabase.from_uri(DATABASE_URL)

print("Connected to:", db.dialect)
print("Available Tables:", db.get_usable_table_names())

# ============================================================
# 4️⃣ GOOGLE GEMINI MODEL INITIALIZATION
# ============================================================
GOOGLE_API_KEY = "AIzaSyAFIzCNqI5kU_UZtGC10-2CmL_hfMADZsU"  # replace with your valid key
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GOOGLE_API_KEY)

# ============================================================
# 5️⃣ FUNCTIONS
# ============================================================

def generate_sql_from_nl(question: str, llm, db: SQLDatabase) -> str:
    """Generate SQL query from natural language question using Gemini."""
    prompt = f"""
    Available Tables: {db.get_usable_table_names()}
    Table Info: {db.table_info}

    Generate a **valid PostgreSQL SQL query only** (no markdown, no explanations)
    for the following request:
    {question}
    """

    # FIX: extract .content from AIMessage
    resp = llm.invoke(prompt)
    sql_query = resp.content.strip() if hasattr(resp, "content") else str(resp).strip()
    sql_query = re.sub(r"```sql|```", "", sql_query, flags=re.IGNORECASE).strip()

    print("\nNatural Language Question:", question)
    print("Generated SQL Query:\n", sql_query)
    return sql_query


def execute_generated_sql(sql_query: str, db: SQLDatabase) -> pd.DataFrame:
    """Execute the generated SQL query on the connected database."""
    try:
        result = db.run(sql_query)
        df = pd.DataFrame(result) if isinstance(result, list) else pd.DataFrame([result])
        return df
    except Exception as e:
        print("Error executing SQL query:", e)
        return pd.DataFrame()


# --- Rephrase step ---
answer_prompt = PromptTemplate.from_template(
    """Given the user question, SQL query, and SQL result, 
    provide a clear and concise natural language answer.

Question: {question}
SQL Query: {query}
SQL Result: {result}

Answer:"""
)
rephrase_answer = answer_prompt | llm | StrOutputParser()


def answer_user_question(question: str, llm, db: SQLDatabase) -> str:
    """Full NL → SQL → Execute → Answer pipeline."""
    sql_query = generate_sql_from_nl(question, llm, db)
    sql_result = execute_generated_sql(sql_query, db)

    # Print SQL result table before rephrasing
    print("\SQL Result:\n", sql_result.to_string(index=False))

    # Step 3: Rephrase into a natural language answer
    answer = rephrase_answer.invoke({
        "question": question,
        "query": sql_query,
        "result": sql_result
    })
    print("\nFinal Answer:\n", answer)
    return answer


# ============================================================
# 6️⃣ TESTING WITH SAMPLE QUESTIONS
# ============================================================
if __name__ == "__main__":
    questions = [
        "List all verified client companies.",
        "Get wallet addresses and emails of end users for client with ID 1.",
        "Count how many end users each client has.",
        "Find API keys that are active for client 6."
    ]

    for i, question in enumerate(questions, 1):
        print(f"\n{'='*70}")
        print(f"Query {i}: {question}")
        print('='*70)
        try:
            answer_user_question(question, llm, db)
        except Exception as e:
            print(f"Failed to answer question {i}: {e}")
