# SOEN

Collaborative AI coding workspace with realtime project chat, Gemini-powered code generation, and in-browser execution via WebContainer.

## Stack

- **Frontend**: React, Vite, Tailwind, Socket.IO client, WebContainer
- **Backend**: Express, MongoDB, Redis, Socket.IO, Google Gemini

## Quick start (local)

### 1. Environment

Copy examples and fill in secrets (see `REQUIRED_ENVIRONMENT_VARIABLES.md`):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start infrastructure

```bash
docker compose up -d mongo redis
```

### 3. Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Production deployment

- **Backend (Render)**: use `render.yaml`, set env vars, deploy from repo root
- **Frontend (Vercel)**: deploy `frontend/`, set `VITE_API_URL` to Render URL

## Health check

`GET /health` — reports MongoDB and Redis status.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend | `npm start` | Start API + Socket.IO |
| backend | `npm run dev` | Start with watch mode |
| backend | `npm test` | Run tests |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build |
