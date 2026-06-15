# Required Environment Variables

This document lists every environment variable used by **SOEN** (collaborative AI coding workspace).

## Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default: `3000`) |
| `NODE_ENV` | No | `development`, `test`, or `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string (use standard `mongodb://` URI if `mongodb+srv://` fails on Windows Node.js DNS) |
| `MONGODB_DBNAME` | No | Database name (optional if included in URI) |
| `JWT_SECRET` | **Yes** | Secret for signing access tokens (min 32 chars recommended) |
| `REFRESH_TOKEN_SECRET` | **Yes** | Secret for signing refresh tokens (min 32 chars recommended) |
| `REDIS_HOST` | **Yes** | Redis hostname |
| `REDIS_PORT` | **Yes** | Redis port |
| `REDIS_PASSWORD` | **Yes** | Redis password (use empty string for local Redis without auth) |
| `GOOGLE_AI_KEY` | **Yes** | Google Gemini API key |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (default: `http://localhost:5173`) |

### Optional (not wired in current codebase — reserved for future auth/email)

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server for transactional email |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

## Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:3000`) |

## Local development with Docker

```bash
docker compose up -d mongo redis
```

Then set in `backend/.env`:

```env
MONGODB_URI=mongodb://mongo:27017/soen
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Deployment

- **Render**: Set all backend variables in the Render dashboard. Use `render.yaml` as reference.
- **Vercel**: Set `VITE_API_URL` to your Render backend URL. Deploy the `frontend` directory.

## Security notes

- Never commit real `.env` files.
- Rotate JWT and refresh token secrets in production.
- Use strong, unique secrets (32+ random characters).
