# EthGlobal Blocksight

A blockchain analytics platform with natural language query capabilities for Ethereum data.

## Project Structure

```
EthGlobal-Blocksight/
├── apps/
│   ├── web/            # Main Next.js web application
│   ├── docs/           # Documentation site (Next.js)
│   └── service/        # NL to SQL API (Python FastAPI)
├── packages/
│   ├── ui/             # Shared React components
│   ├── eslint-config/  # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
└── turbo.json          # Turborepo configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+ (for the service API)
- PostgreSQL database

### Installation

```bash
# Install all dependencies
pnpm install
```

## Running Applications

### 1. Web Application
```bash
pnpm dev
```
Runs on http://localhost:3000

### 2. Documentation Site
```bash
pnpm dev --filter=docs
```
Runs on http://localhost:3001

### 3. NL to SQL API Service
```bash
cd apps/service
pip install -r requirements.txt

# Configure .env with your DATABASE_URL and GOOGLE_API_KEY
python run.py
```
Runs on http://localhost:8000

See [apps/service/README.md](./apps/service/README.md) for detailed setup.

## Development

### Run all apps
```bash
pnpm dev
```

### Build all apps
```bash
pnpm build
```

### Lint
```bash
pnpm lint
```

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend API**: Python, FastAPI, LangChain
- **AI**: Google Gemini for natural language processing
- **Database**: PostgreSQL
- **Monorepo**: Turborepo
- **Package Manager**: pnpm

## Features

- 🔍 Natural language queries for blockchain data
- 📊 Real-time blockchain analytics
- 🤖 AI-powered SQL generation using Google Gemini
- 🚀 Fast, type-safe full-stack application
- 📦 Shared component library across apps

## Environment Variables

### Service API (apps/service/.env)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
GOOGLE_API_KEY=your_google_gemini_api_key
API_HOST=0.0.0.0
API_PORT=8000
```

## Project Highlights

- **Monorepo Architecture**: Shared code and configurations across multiple apps
- **Type Safety**: Full TypeScript coverage for frontend applications
- **AI Integration**: Natural language to SQL query conversion
- **Modern Stack**: Latest Next.js, React, and FastAPI
