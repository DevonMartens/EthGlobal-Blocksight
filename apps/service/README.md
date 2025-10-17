# Natural Language to SQL API

Convert natural language questions into SQL queries using Google Gemini AI. The API executes queries against your PostgreSQL database and returns both structured results and natural language answers.

## Setup

### 1. Install Dependencies
```bash
cd apps/service
pip install -r requirements.txt
```

### 2. Configure Environment
Edit `.env` file with your credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 3. Run
```bash
python run.py
```

Visit http://localhost:8000/docs for API documentation.

## API Endpoints

**POST** `/api/v1/query` - Execute natural language query
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all verified clients"}'
```

**GET** `/api/v1/database/info` - Get database info

**GET** `/api/v1/health` - Health check

## Example Response
```json
{
  "success": true,
  "question": "Show me all verified clients",
  "sql_query": "SELECT * FROM clients WHERE verified = true;",
  "result": [{"id": 1, "company_name": "Acme Corp", "verified": true}],
  "answer": "There is 1 verified client: Acme Corp."
}
```

## Project Structure
```
apps/service/
├── run.py              # Run this to start the server
├── .env                # Your credentials
├── requirements.txt    # Dependencies
└── api/
    ├── main.py         # FastAPI app
    ├── config.py       # Configuration
    ├── routes/         # API endpoints
    └── services/       # Business logic
```

## Troubleshooting

**Import errors**: Make sure you're in `apps/service` directory when running `python run.py`

**Database connection failed**: Check `DATABASE_URL` in `.env`

**Google API error**: Verify `GOOGLE_API_KEY` is correct

