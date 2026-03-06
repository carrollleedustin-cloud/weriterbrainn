# WeriterBrainn – Deployment Guide

## Netlify Deployment

### Prerequisites

- Netlify account
- PostgreSQL database (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)) with **pgvector** extension enabled
- OpenAI API key

### Environment Variables

Set these in **Netlify Dashboard → Site settings → Environment variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat and embeddings |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql+asyncpg://user:pass@host:5432/dbname`. Use **asyncpg** driver. |
| `API_KEY` | No | Optional API key for backend auth (when set, requires `x-api-key` header) |
| `CORS_ORIGINS` | No | Comma-separated origins, or `*` for all (default `*`) |
| `JWT_SECRET` | No | Secret for JWT signing (default change-me-in-production; set in production) |
| `JWT_EXPIRE_MINUTES` | No | Token expiry in minutes (default 10080 = 7 days) |

### Database Setup

1. Create a PostgreSQL database.
2. Enable the **pgvector** extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run migrations from your machine or a one-off Netlify build:
   ```bash
   alembic upgrade head
   ```
   Use the same `DATABASE_URL` as in Netlify.

### Connect Repository

1. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
2. Select your repository
3. Build settings are read from `netlify.toml`; no changes needed if using defaults:
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/out`
4. **Python API (optional):** To run the FastAPI backend as a Netlify serverless function, add the **Python** build plugin in Netlify: **Build & deploy → Build plugins → Add plugin → search "Python"** and install. Without it, only the static frontend deploys; host the API elsewhere (e.g. Railway, Render) and set `NEXT_PUBLIC_API_URL` to that URL.
5. Add environment variables (see above)
6. Deploy

### Frontend API URL

In production, the frontend must call your Netlify site URL, not localhost. Either:

- Set `NEXT_PUBLIC_API_URL` to your Netlify URL (e.g. `https://your-site.netlify.app`) in Netlify env vars before build, or
- Use relative URLs (`/api`) in the frontend so it works with the same origin

Update `frontend/src/lib/api.ts` if needed so `API_BASE` uses `NEXT_PUBLIC_API_URL` (default is `http://localhost:8000`). For Netlify, set:

```
NEXT_PUBLIC_API_URL=https://your-site.netlify.app
```

### Routes

| Path | Serves |
|------|--------|
| `/` | Next.js static frontend |
| `/chat`, `/memories`, etc. | Next.js pages |
| `/api/*` | FastAPI backend (Netlify function) |
| `/docs` | OpenAPI docs |
| `/redoc` | ReDoc |

## Local Pre-Deploy Checklist

- [ ] `pytest` passes
- [ ] `cd frontend && npm test` passes
- [ ] `cd frontend && npm run build` succeeds
- [ ] `alembic upgrade head` applied to target DB
- [ ] `OPENAI_API_KEY` and `DATABASE_URL` set in Netlify
