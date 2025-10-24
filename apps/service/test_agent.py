"""
Test script for ASI Agent
This makes it easier to test and see full responses
"""
import requests
import json

BASE_URL = "http://localhost:8002"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*70)
    print("🏥 TESTING HEALTH CHECK")
    print("="*70)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_generate_sql(question):
    """Test SQL generation"""
    print("\n" + "="*70)
    print("🔍 TESTING SQL GENERATION")
    print("="*70)
    print(f"Question: {question}\n")
    
    response = requests.post(
        f"{BASE_URL}/generate_sql",
        json={"question": question}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\n📝 Generated SQL:")
    print("-" * 70)
    print(result.get('sql', 'No SQL returned'))
    print("-" * 70)
    
    return result

def test_full_query(question):
    """Test full query execution"""
    print("\n" + "="*70)
    print("🚀 TESTING FULL QUERY EXECUTION")
    print("="*70)
    print(f"Question: {question}\n")
    
    response = requests.post(
        f"{BASE_URL}/query",
        json={"question": question}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.json()}")
        return None
    
    result = response.json()
    
    print(f"\n📝 Generated SQL:")
    print("-" * 70)
    print(result.get('sql', 'No SQL returned'))
    print("-" * 70)
    
    if result.get('result'):
        print(f"\n📊 Results ({result.get('rows_returned', 0)} rows):")
        print("-" * 70)
        for i, row in enumerate(result['result'][:5], 1):  # Show first 5 rows
            print(f"{i}. {row}")
        if result.get('rows_returned', 0) > 5:
            print(f"... and {result['rows_returned'] - 5} more rows")
        print("-" * 70)
    
    print(f"\n💡 Answer:")
    print("-" * 70)
    print(result.get('answer', 'No answer returned'))
    print("-" * 70)
    
    return result

def main():
    """Run all tests"""
    print("🤖 ASI Agent Test Suite")
    print("="*70)
    
    try:
        # Test 1: Health check
        health_info = test_health()
        db_connected = health_info.get('database_connected', False)
        
        # Test 2: Generate SQL only
        print("\n" + "="*70)
        print("📝 PART 1: SQL GENERATION TESTS (No Execution)")
        print("="*70)
        
        test_generate_sql("How many NFTs does each wallet own?")
        test_generate_sql("Show me the top 5 token balances")
        test_generate_sql("What are the most recent 10 transactions?")
        
        # Test 3: Full query execution (if database connected)
        if db_connected:
            print("\n" + "="*70)
            print("🚀 PART 2: FULL QUERY EXECUTION TESTS (With NL Answers)")
            print("="*70)
            print("Database is connected! Testing full query execution...\n")
            
            test_full_query("How many end users are there in total?")
            test_full_query("Show me the most recent 5 transactions")
            test_full_query("What are the top 3 token balances?")
            test_full_query("List all unique client IDs from end users")
        else:
            print("\n" + "="*70)
            print("⚠️  Database not connected - skipping execution tests")
            print("="*70)
            print("To test query execution, configure DATABASE_URL in .env file")
        
        print("\n" + "="*70)
        print("✅ ALL TESTS COMPLETED")
        print("="*70 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to agent")
        print("   Make sure the agent is running: python lib/asi_agent.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

