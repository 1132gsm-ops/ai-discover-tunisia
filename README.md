# AI Discover Tunisia

شركة إعلامية ذكية (AI Media Agency) - MVP.

## Components

- Backend: FastAPI + SQLAlchemy + PostgreSQL + Redis
- Frontend: Next.js 16 + React 19 + Tailwind
- LLM: OpenRouter (Nemotron 550B Free)
- Automation: n8n (planned)
- PM2: process management

## Running

### Backend

    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --host 0.0.0.0 --port 8000

### Frontend

    cd frontend
    npm install
    npm run build
    npm start

### PM2

    pm2 start ecosystem.config.js
    pm2 start "npm start" --name "ai-discover" --cwd /opt/ai-discover-tunisia/frontend
    pm2 save

## Environment Variables

### backend/.env

    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_NAME=aidt_db
    DB_USER=aidt_user
    DB_PASSWORD=<password>
    REDIS_URL=redis://127.0.0.1:6379/0
    OPENROUTER_API_KEY=<key>

### frontend/.env.local

    NEXT_PUBLIC_API_URL=http://192.168.0.102:8000

## API Endpoints

- GET / - company info
- GET /health - system health
- GET /api/tasks - list tasks
- POST /api/tasks - create task
- POST /api/ceo/command - send CEO command
- GET /api/ceo/commands - list commands
- PATCH /api/ceo/commands/{id} - update status
- DELETE /api/ceo/commands/{id} - delete command

## Development Notes

- .env files are git-ignored (secrets)
- Use PM2 for production
- All API responses are JSON
- LLM falls back to rule-based if OpenRouter fails
