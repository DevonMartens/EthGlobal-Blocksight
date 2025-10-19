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
ALCHEMY_API_KEY=your_alchemy_api_key
```

### 3. Run
```bash
python run.py
```

Visit http://localhost:8000/docs for API documentation.

## API Endpoints

### Natural Language Queries
**POST** `/api/v1/query` - Execute natural language query
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all verified clients"}'
```

### Wallet Data (Streaming)
**GET** `/api/v1/wallet/{address}/metadata` - Get wallet metadata
```bash
curl http://localhost:8000/api/v1/wallet/vitalik.eth/metadata
```

**GET** `/api/v1/wallet/{address}/transfers/stream` - Stream transfers (SSE)
```bash
# Get both directions (1000 from + 1000 to = 2000 total)
curl "http://localhost:8000/api/v1/wallet/vitalik.eth/transfers/stream?direction=both&max_transfers=1000"

# Get only outgoing transfers
curl "http://localhost:8000/api/v1/wallet/vitalik.eth/transfers/stream?direction=from&max_transfers=1000"

# Get only incoming transfers
curl "http://localhost:8000/api/v1/wallet/vitalik.eth/transfers/stream?direction=to&max_transfers=1000"
```

**GET** `/api/v1/wallet/{address}/tokens` - Get ERC-20 token balances
```bash
curl http://localhost:8000/api/v1/wallet/vitalik.eth/tokens
```

**GET** `/api/v1/wallet/{address}/nfts/stream` - Stream NFTs (SSE)
```bash
curl http://localhost:8000/api/v1/wallet/vitalik.eth/nfts/stream
```

**GET** `/api/v1/wallet/{address}/full` - Get all wallet data at once
```bash
curl "http://localhost:8000/api/v1/wallet/vitalik.eth/full?include_nft=true"
```

### System
**GET** `/api/v1/database/info` - Get database info

**GET** `/api/v1/health` - Health check

## Example Responses

### NL Query Response
```json
{
  "success": true,
  "question": "Show me all verified clients",
  "sql_query": "SELECT * FROM clients WHERE verified = true;",
  "result": [{"id": 1, "company_name": "Acme Corp", "verified": true}],
  "answer": "There is 1 verified client: Acme Corp."
}
```

### Wallet Metadata Response
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "ens": "vitalik.eth",
  "ethBalance": "1234567890000000000",
  "ethBalanceFormatted": "1.23456789",
  "transactionCount": 1234
}
```

### Streaming Response (Server-Sent Events)
Wallet endpoints with `/stream` return SSE format:
```
data: {"type": "from_transfers", "page": 1, "count": 1000, "total": 1000, "data": [...]}

data: {"type": "from_transfers", "page": 2, "count": 1000, "total": 2000, "data": [...]}

data: {"type": "complete", "message": "Transfer fetch complete"}
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

## Features

- 🤖 **Natural Language to SQL**: Convert questions to SQL queries using Google Gemini
- 🔗 **Blockchain Data**: Fetch wallet transactions, NFTs, and token balances
- 📡 **Streaming API**: Server-Sent Events for real-time data as it arrives
- 🚀 **Parallel Fetching**: Separate endpoints for concurrent data fetching
- 🎯 **ENS Support**: Use ENS names instead of addresses

## Troubleshooting

**Import errors**: Make sure you're in `apps/service` directory when running `python run.py`

**Database connection failed**: Check `DATABASE_URL` in `.env`

**Google API error**: Verify `GOOGLE_API_KEY` is correct

**Alchemy API error**: Verify `ALCHEMY_API_KEY` is correct and has proper permissions

