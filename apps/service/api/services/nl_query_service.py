"""
Natural Language to SQL Query Service.
Handles conversion of natural language questions to SQL queries and execution.
"""
import re
import pandas as pd
from typing import Dict, Any
from decimal import Decimal
from datetime import datetime, date
from langchain_community.utilities import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from api.config import settings


class NLQueryService:
    """Service for handling natural language to SQL conversions."""
    
    def __init__(self):
        """Initialize the service with database and LLM connections."""
        self.db = None
        self.llm = None
        self._initialize()
    
    @staticmethod
    def _convert_to_json_serializable(obj):
        """
        Convert non-JSON-serializable objects to serializable types.
        
        Args:
            obj: Object to convert
            
        Returns:
            JSON-serializable version of the object
        """
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, bytes):
            return obj.hex()
        elif pd.isna(obj):
            return None
        return obj
    
    def _initialize(self):
        """Initialize database and LLM connections."""
        try:
            # Initialize database connection
            self.db = SQLDatabase.from_uri(settings.DATABASE_URL)
            print(f"Connected to database: {self.db.dialect}")
            print(f"Available tables: {self.db.get_usable_table_names()}")
            
            # Initialize Google Gemini LLM
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash-exp",
                google_api_key=settings.GOOGLE_API_KEY
            )
            print("Gemini LLM initialized successfully")
            
        except Exception as e:
            print(f"Error initializing NLQueryService: {e}")
            raise
    
    def generate_sql_from_nl(self, question: str) -> str:
        """
        Generate SQL query from natural language question using Gemini.
        
        Args:
            question: Natural language question
            
        Returns:
            Generated SQL query string
        """
        prompt = f"""
        Available Tables: {self.db.get_usable_table_names()}
        Table Info: {self.db.table_info}

        Generate a **valid PostgreSQL SQL query only** (no markdown, no explanations)
        for the following request:
        {question}
        """

        # Extract content from AIMessage
        resp = self.llm.invoke(prompt)
        sql_query = resp.content.strip() if hasattr(resp, "content") else str(resp).strip()
        sql_query = re.sub(r"```sql|```", "", sql_query, flags=re.IGNORECASE).strip()

        print(f"\nNatural Language Question: {question}")
        print(f"Generated SQL Query:\n{sql_query}")
        return sql_query

    def execute_generated_sql(self, sql_query: str) -> pd.DataFrame:
        """
        Execute the generated SQL query on the connected database.
        
        Args:
            sql_query: SQL query string to execute
            
        Returns:
            DataFrame containing query results
        """
        try:
            # Use SQLAlchemy directly to get results with column names
            from sqlalchemy import create_engine, text
            
            engine = create_engine(settings.DATABASE_URL)
            with engine.connect() as connection:
                result = connection.execute(text(sql_query))
                
                # Check if query returns rows
                if result.returns_rows:
                    rows = result.fetchall()
                    if rows:
                        # Create DataFrame with proper column names
                        df = pd.DataFrame(rows, columns=result.keys())
                    else:
                        # Empty result with columns
                        df = pd.DataFrame(columns=result.keys())
                else:
                    # For INSERT/UPDATE/DELETE queries
                    df = pd.DataFrame([{"affected_rows": result.rowcount}])
            
            return df
        except Exception as e:
            print(f"Error executing SQL query: {e}")
            raise Exception(f"Database query execution failed: {str(e)}")

    def rephrase_answer(self, question: str, query: str, result: pd.DataFrame) -> str:
        """
        Rephrase SQL results into a natural language answer.
        
        Args:
            question: Original natural language question
            query: Generated SQL query
            result: Query result DataFrame
            
        Returns:
            Natural language answer
        """
        answer_prompt = PromptTemplate.from_template(
            """Given the user question, SQL query, and SQL result, 
            provide a clear and concise natural language answer.

Question: {question}
SQL Query: {query}
SQL Result: {result}

Answer:"""
        )
        
        rephrase_chain = answer_prompt | self.llm | StrOutputParser()
        
        answer = rephrase_chain.invoke({
            "question": question,
            "query": query,
            "result": result.to_string(index=False)
        })
        
        return answer

    def answer_user_question(self, question: str) -> Dict[str, Any]:
        """
        Full NL → SQL → Execute → Answer pipeline.
        
        Args:
            question: Natural language question
            
        Returns:
            Dictionary containing query, result, and answer
        """
        try:
            # Step 1: Generate SQL from natural language
            sql_query = self.generate_sql_from_nl(question)
            
            # Step 2: Execute SQL query
            sql_result = self.execute_generated_sql(sql_query)
            print(f"\nSQL Result:\n{sql_result.to_string(index=False)}")
            
            # Step 3: Rephrase into natural language answer
            answer = self.rephrase_answer(question, sql_query, sql_result)
            print(f"\nFinal Answer:\n{answer}")
            
            # Convert DataFrame to list of dictionaries for JSON serialization
            result_data = sql_result.to_dict(orient='records')
            
            # Convert non-JSON-serializable objects (Decimal, datetime, etc.)
            result_data = [
                {k: self._convert_to_json_serializable(v) for k, v in row.items()}
                for row in result_data
            ]
            
            return {
                "success": True,
                "question": question,
                "sql_query": sql_query,
                "result": result_data,
                "answer": answer
            }
            
        except Exception as e:
            import traceback
            print(f"Error processing question: {e}")
            print(f"Traceback:\n{traceback.format_exc()}")
            return {
                "success": False,
                "question": question,
                "error": str(e)
            }
    
    def get_database_info(self) -> Dict[str, Any]:
        """
        Get information about the connected database.
        
        Returns:
            Dictionary containing database information
        """
        try:
            return {
                "dialect": self.db.dialect,
                "tables": self.db.get_usable_table_names(),
                "connected": True
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }


# Create a global service instance
nl_query_service = NLQueryService()

