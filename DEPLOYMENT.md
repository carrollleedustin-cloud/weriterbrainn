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
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname` |
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
3. Run migrations. The DB schema was created by Alembic (Python). To run migrations from a machine with Python:
   ```bash
   alembic upgrade head
   ```
   Or apply the schema manually from `alembic/versions/`. Use the same `DATABASE_URL` as in Netlify.

### Connect Repository

1. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
2. Select your repository
3. Build settings are read from `netlify.toml`; no changes needed if using defaults:
   - **Build command**: `npm install && cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/out`
   - The API runs as a Node.js Netlify serverless function (no Python plugin required).
4. Add environment variables (see above)
5. Deploy

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
| `/api/*` | Express backend (Node.js Netlify function) |

## Local Pre-Deploy Checklist

- [ ] `cd frontend && npm test` passes
- [ ] `npm install && cd frontend && npm run build` succeeds
- [ ] DB schema applied (via `alembic upgrade head` or manual)
- [ ] `OPENAI_API_KEY` and `DATABASE_URL` set in Netlify
