# WeriterBrainn – Personal AI Brain

WeriterBrainn is a **personal AI brain** that acts as a persistent thinking partner and knowledge engine. It stores your conversations, notes, ideas, projects, beliefs, and goals; builds a long-term knowledge graph; and uses retrieval-augmented generation to answer in your own style.

This repository is structured as:

- `app/` – FastAPI backend (Python 3.11, PostgreSQL, pgvector)
- `frontend/` – Next.js + React + TypeScript + Tailwind + ShadCN UI
- `netlify/functions/` – Netlify serverless functions (FastAPI handler)
- `alembic/` – Database migrations
- `tests/` – Backend tests (pytest)

## Prerequisites

- Python 3.11
- Node.js 18+
- PostgreSQL 15+ with `pgvector` extension installed
- OpenAI API key

## Backend – Local Development

1. Create and activate a virtual environment:

```bash
cd weriterbrainn
python -m venv .venv
.venv\Scripts\activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Set environment variables (for local dev):

```bash
$env:OPENAI_API_KEY="sk-..."            # PowerShell
$env:DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/weriterbrainn"
```

4. Run the API server:

```bash
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`.

## Frontend – Local Development

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Database Migrations

```bash
# Create database first, then:
alembic upgrade head
```

## Running Tests

```bash
pytest
```

## Netlify Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

1. Connect the repo to Netlify.
2. Set environment variables: `OPENAI_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL` (your Netlify site URL).
3. Enable pgvector on your PostgreSQL database; run `alembic upgrade head`.
4. Deploy; `netlify.toml` provides build command, publish dir, and API redirects.

## Phase 1 Summary

- **Backend**: FastAPI app, config, DB session, health API
- **Models**: User, Memory, MemoryEmbedding, KnowledgeGraphNode/Edge, PersonaMetric, Conversation, ConversationMessage, AnalyticsEvent
- **Migrations**: Alembic with initial schema + pgvector
- **Netlify**: Mangum handler, redirects for API/docs
- **Frontend**: Next.js + TypeScript + Tailwind, static export, nav + placeholder pages (Chat, Memory, Graph, Writing, Analytics)
- **Tests**: pytest + health endpoint tests

## Phase 2 Summary

- **Memory service**: `store_memory()` with chunked embeddings, `search_memories()` semantic search (pgvector)
- **Extraction service**: `extract_entities_and_relations()` via OpenAI
- **Knowledge graph**: `upsert_node()`, `upsert_edge()`, `add_extraction_to_graph()`
- **Persona service**: `record_writing_sample()`, `get_persona_summary()` (sentence length, vocab complexity)
- **RAG chat**: `chat_with_context()` — retrieves memories, calls OpenAI
- **API routes**: `/api/v1/memories` (POST, GET /search), `/api/v1/chat` (POST), `/api/v1/graph` (GET nodes/edges, POST /extract), `/api/v1/persona` (GET, POST /record)

## Phase 3 Summary

- **Unified retrieval** (`app/services/ai/retrieval.py`): `build_rag_context()` combines memories, recent conversation, and KG entities (ILIKE search + related nodes)
- **Persona-aware chat**: System prompt includes sentence length and vocab metrics for style mimicry
- **Adaptive top_k**: `get_adaptive_top_k()` adjusts retrieval size from regeneration vs acceptance rates
- **Analytics events**: `response_accepted`, `response_regenerated`, `response_edited` via POST `/api/v1/analytics/events`
- **Streaming chat**: POST `/api/v1/chat/` with `stream: true` returns SSE stream
- **Conversation persistence**: Messages saved when using `conversation_id`; history used in RAG context

## Phase 4 Summary

- **AI Chat** (`/chat`): Streaming responses, message history, Regenerate/Accept buttons, conversation persistence
- **Memory Explorer** (`/memories`): Semantic search, add memories (note/idea/project/etc), timeline-style result cards
- **Knowledge Graph** (`/graph`): 2D force-directed graph (react-force-graph-2d), extract-from-text input
- **Writing Assistant** (`/writing`): Editor with Improve, Expand, Rewrite; persona-aware suggestions
- **Analytics Dashboard** (`/analytics`): Persona metrics (sentence length, vocab complexity)

Frontend uses `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) to call the backend.

## Phase 5 Summary

- **Backend tests**: pytest with mocked DB (override `get_db`) and mocked services; no real PostgreSQL required for unit tests
- **API tests**: health, chat, memory (create/search), graph (nodes/edges/extract), persona, analytics
- **Frontend tests**: Jest + React Testing Library for component tests
- **Coverage**: `pytest-cov` available; run `pytest --cov=app` for backend coverage

### Running tests

```bash
# Backend (requires pip install -r requirements.txt)
pytest

# Backend with coverage
pytest --cov=app --cov-report=term-missing

# Frontend (requires npm install in frontend/)
cd frontend && npm test
```

## Phase 6 Summary

- **Netlify config**: `netlify.toml` finalized for frontend build + Python functions; redirects for `/api/*`, `/docs`, `/redoc`
- **CI**: GitHub Actions runs pytest and frontend tests on push/PR to main/develop
- **Docs**: [DEPLOYMENT.md](DEPLOYMENT.md) with env vars, DB setup (pgvector), and step-by-step Netlify deployment

## Phase 7 Summary

- **Rate limiting**: SlowAPI (200 req/min default)
- **CORS**: Configurable via `CORS_ORIGINS` env (default `*`)
- **Input validation**: Pydantic `Field` constraints (max_length) on memory content, chat message
- **API key auth**: Optional `require_api_key` dependency when `API_KEY` is set; see `app/api/deps.py`
- **Global exception handler**: Catches unhandled exceptions, returns 500, logs error
- **Auto-store chat**: User messages stored as memories in background (CONVERSATION type)

## Phase 8 Summary

- **Auth**: JWT-based register/login at `/api/v1/auth/register` and `/api/v1/auth/login`; optional `Authorization: Bearer <token>` for user-scoped data
- **User-scoped chat**: When Bearer token is present, conversations and RAG context are scoped by `user_id`
- **Health**: `/api/v1/health/` (liveness), `/api/v1/health/ready` (readiness, checks DB)
- **Config**: `JWT_SECRET`, `JWT_EXPIRE_MINUTES`; set `JWT_SECRET` in production

## Phase 9 Summary

- **GET /api/v1/auth/me**: Returns current user when `Authorization: Bearer <token>` is valid
- **User-scoped data**: Memories, graph (nodes/edges), persona, analytics, and chat use `user_id` when authenticated; unauthenticated requests use `user_id=None`
- **Frontend auth**: Login and Register pages (`/login`, `/register`); token stored in `localStorage`; all API calls send `Authorization: Bearer` when token exists
- **Nav**: `NavAuth` shows Log in / Register or user display name + Log out

## Phase 9 Summary

- **GET /api/v1/auth/me**: Returns current user when `Authorization: Bearer` is present
- **User-scoped data**: Memories, graph (nodes/edges), persona, and analytics use `user_id` when the user is logged in; anonymous data remains `user_id=None`
- **Frontend auth**: Login and Register pages (`/login`, `/register`); JWT stored in `localStorage`; all API calls send `Authorization: Bearer` when token exists; nav shows Log in/Register or user + Log out 

