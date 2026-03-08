# WeriterBrainn — Setup Guide

Complete setup for Supabase, API keys, and local/production deployment.

---

## Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [OpenAI API Key](#2-openai-api-key)
3. [JWT Secret](#3-jwt-secret)
4. [Local Environment](#4-local-environment)
5. [Netlify Environment Variables](#5-netlify-environment-variables)
6. [Run Migrations](#6-run-migrations)
7. [Verification Checklist](#7-verification-checklist)

---

## 1. Supabase Setup

### Create a Project

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Sign in or create an account
3. Click **New project**
4. Fill in:
   - **Name** — e.g. `weriterbrainn`
   - **Database password** — create and save this; you’ll need it for `DATABASE_URL`
   - **Region** — choose the closest to your users
5. Click **Create new project** (wait 2–3 minutes)

**Docs:** [Get started with Supabase](https://supabase.com/docs/guides/getting-started)

---

### Get the Database Connection String

1. In your project, open **Project Settings** (gear icon in the sidebar)
2. Go to **[Database](https://supabase.com/dashboard/project/_/settings/database)** settings
3. Scroll to **Connection string**
4. Pick the correct connection type:

| Use case | Connection type | Port |
|----------|-----------------|------|
| **Migrations** (`npm run migrate:up`) | **Direct** (Session) | 5432 |
| **API / Netlify Functions** | **Transaction** (Pooler) | 6543 |

**Format:**

- **Direct:**  
  `postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

- **Pooler (serverless):**  
  `postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

Replace:
- `[PROJECT_REF]` — e.g. `abcdefghijklmnop` from your project URL
- `[YOUR-PASSWORD]` — the database password from project creation
- `[REGION]` — e.g. `us-east-1`

**Docs:** [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

### Enable pgvector

Supabase supports pgvector. Enable it in one of these ways:

**Option A — Dashboard**

1. Go to **Database → Extensions**
2. Search for `vector`
3. Click **Enable**

**Option B — SQL Editor**

1. Go to **SQL Editor**
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

**Docs:** [Vector columns](https://supabase.com/docs/guides/ai/vector-columns)

---

## 2. OpenAI API Key

1. Go to **[OpenAI API Keys](https://platform.openai.com/api-keys)**
2. Sign in or create an account
3. Click **Create new secret key**
4. Name it (e.g. `weriterbrainn`) and create
5. Copy the key immediately — it’s shown only once

**Important:**
- Store it in env vars only, never in code
- Do not use it in frontend/client code
- Use billing if needed: [Usage and Billing](https://platform.openai.com/account/billing)

**Docs:** [API keys](https://help.openai.com/en/articles/4936850-how-to-create-and-use-an-api-key)

---

## 3. JWT Secret

Used to sign auth tokens. Generate a strong random string:

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Bash / Git Bash:**
```bash
openssl rand -base64 32
```

Or use an online generator like [randomkeygen.com](https://randomkeygen.com/) (CodeIgniter Encryption Keys section).

---

## 4. Local Environment

### Backend and API

Create `.env` in the project root:

```env
# Required
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your-32-plus-char-random-string

# Optional
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
JWT_EXPIRE_MINUTES=10080
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

For local API with pooler (e.g. serverless-like):

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Use this when the API runs on port 8000. Leave unset when using Netlify (same-origin `/api`).

### Run Locally

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 5. Netlify Environment Variables

1. Open **[Netlify Dashboard](https://app.netlify.com/)**
2. Select the site (or create one and connect the repo)
3. Go to **Site configuration → Environment variables**  
   Or: **Site settings → Build & deploy → Environment → Edit variables**
4. Add:

| Key | Value | Scope |
|-----|-------|-------|
| `DATABASE_URL` | Pooler connection string | All |
| `OPENAI_API_KEY` | Your OpenAI key | All |
| `JWT_SECRET` | Your JWT secret | All |
| `CORS_ORIGINS` | `https://yoursite.netlify.app` | Production |

**For deploy previews:** Either reuse these or add context-specific overrides.

**Docs:** [Environment variables](https://docs.netlify.com/build/environment-variables/overview/)

---

## 6. Run Migrations

After `DATABASE_URL` is set:

```bash
# One-time: create schema and tables
DATABASE_URL=postgresql://... npm run migrate:up
```

Use the **Direct** connection (port 5432) if migrations fail with the pooler.

**Verify in Supabase:**
- **Table Editor** — tables like `users`, `memories`, `conversations`, etc.

### RLS (Row Level Security)

The schema enables RLS so each user only sees their own data. The API automatically sets `app.user_id` per request:

- After auth middleware, `req.userId` (from JWT) is stored in async context
- Each DB query runs `SET LOCAL app.user_id = :userId` before execution
- Login/register work without a session; other routes require a valid token

No extra configuration needed—RLS is wired in the server.

---

## 7. Verification Checklist

- [ ] Supabase project created
- [ ] Database password saved
- [ ] Connection string (Direct and/or Pooler) obtained
- [ ] pgvector extension enabled
- [ ] OpenAI API key created and stored
- [ ] JWT secret generated
- [ ] `.env` created in project root
- [ ] `frontend/.env.local` created (if running frontend locally against local API)
- [ ] Migrations run (`npm run migrate:up`)
- [ ] Netlify env vars set (if deploying)

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Supabase Database Settings | https://supabase.com/dashboard/project/_/settings/database |
| Supabase: Connect to Postgres | https://supabase.com/docs/guides/database/connecting-to-postgres |
| Supabase: Vector columns | https://supabase.com/docs/guides/ai/vector-columns |
| OpenAI API Keys | https://platform.openai.com/api-keys |
| OpenAI: Create API key | https://help.openai.com/en/articles/4936850-how-to-create-and-use-an-api-key |
| Netlify Environment Variables | https://docs.netlify.com/build/environment-variables/overview/ |
