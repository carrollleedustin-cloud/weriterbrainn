# WeriterBrainn — Autonomous AI CTO Audit & System Blueprint

**Date:** March 2025  
**Purpose:** Complete technical documentation for engineers to understand, replicate, improve, and scale the application.

---

## 1. Product Overview

### App Purpose

WeriterBrainn is a **Personal AI Brain** — a thinking partner that remembers, learns, and adapts to the user. It solves:

- **Context loss:** Traditional chat interfaces forget past conversations and user preferences
- **Personal knowledge silos:** Scattered notes, beliefs, and projects without a unified retrieval system
- **Generic AI responses:** One-size-fits-all outputs that don’t reflect the user’s voice or cognitive style

### Target Users

- **Individual knowledge workers** (writers, researchers, creators) who want persistent, personalized AI assistance
- **Users who value** memory, writing style adaptation, and a knowledge graph of their ideas and relationships

### Core Product Value

- Persistent semantic memory with hybrid search
- AI chat with RAG (memories, knowledge graph, conversation history)
- Knowledge graph with entity extraction and relationships
- Cognitive/persona profiling that adapts AI tone and style
- Writing assistant that mirrors user voice

### Core Capabilities

| Capability | Description |
|------------|-------------|
| User accounts | Email/password auth, JWT, profile |
| Memory system | Store, search (semantic + full-text), consolidate |
| AI chat | Streaming and JSON chat with RAG and citations |
| Knowledge graph | Nodes, edges, entity extraction, semantic search |
| Persona / cognitive profile | Metrics extraction, profile building, prompt adaptation |
| Analytics | Event tracking, insights dashboard, productivity patterns |
| Writing assistant | Improve, expand, rewrite with persona sync |
| Health checks | Liveness and readiness (DB, Redis) |

---

## 2. Complete Feature Inventory

### User Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ | Email, password (min 8 chars), optional display_name |
| Login | ✅ | JWT access token, 7-day expiry |
| Profile / me | ✅ | `GET /auth/me` returns user info |
| Settings | ❌ | Not implemented |
| Account deletion | ❌ | Not implemented |
| Password reset | ❌ | Not implemented |

### Memory Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Create memory | ✅ | Content, type, optional title |
| Search memories | ✅ | Semantic + FTS hybrid, filters (type, tier) |
| Consolidate memories | ✅ | Promote short_term → long_term |
| Memory types | ✅ | conversation, note, idea, document, project, belief, goal |
| Importance scoring | ✅ | Heuristic + content signals |
| Tier system | ✅ | short_term / long_term |

### Chat Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Send message | ✅ | JSON or SSE streaming |
| Conversation continuity | ✅ | conversation_id for multi-turn |
| RAG context | ✅ | Memories, KG, conversation history |
| Memory citations | ✅ | [1], [2] in response, X-Citations header |
| Persona adaptation | ✅ | Tone, length, sentiment from cognitive profile |
| Regenerate / Accept | ✅ | Analytics events; no edit flow in UI |

### Knowledge Graph Systems

| Feature | Status | Notes |
|---------|--------|-------|
| List nodes / edges | ✅ | All user’s nodes and edges |
| Entity extraction | ✅ | LLM extraction from text |
| Semantic entity search | ✅ | Vector search when embeddings exist |
| Entity deduplication | ✅ | Name similarity merge |
| Relationship inference | ✅ | Co-occurrence `related_to` |
| Timeline extraction | ✅ | Stored in metadata.temporal |
| Graph visualization | ✅ | react-force-graph-2d, zoom, search, highlight |

### Persona / Cognitive Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Record writing sample | ✅ | Extracts metrics from text |
| Cognitive profile | ✅ | Tone, sentiment, length preference, etc. |
| Persona-driven prompts | ✅ | Injected into chat system prompt |
| Profile storage | ✅ | user_cognitive_profiles table |

### Analytics Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Record event | ✅ | response_accepted, response_regenerated, response_edited |
| Insights | ✅ | Event counts by day (7/14/30 days) |
| Productivity patterns | ✅ | Stacked bar chart in dashboard |

### Writing Assistant

| Feature | Status | Notes |
|---------|--------|-------|
| Improve | ✅ | Clarity and flow |
| Expand | ✅ | Elaborate on ideas |
| Rewrite | ✅ | Uses chat + persona |
| Persona sync | ✅ | Records sample for profile |

### Admin Systems

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard | ❌ | Not implemented |
| Moderation | ❌ | Not implemented |
| User management | ❌ | Not implemented |

---

## 3. Feature Deep Dives

### 3.1 User Registration

- **Description:** Create account with email and password.
- **User Journey:** Navigate to /register → fill form → submit → token stored → redirect.
- **UI:** Form (email, password, optional display name), validation, error display.
- **Backend:** `AuthService` → bcrypt hash → `UserRepository.create` → JWT.
- **API:** `POST /api/v1/auth/register` — body: `{ email, password, display_name? }`.
- **Storage:** `users` (id, email, hashed_password, display_name, is_active).
- **Permissions:** Public.
- **Dependencies:** bcrypt, JWT, PostgreSQL.

### 3.2 Memory Creation

- **Description:** Store a memory with content and type; optionally queue embeddings.
- **User Journey:** Submit from memories page or implicitly via chat; API creates memory.
- **UI:** Create form (content, type, title); search results list memories.
- **Backend:** `MemoryService.storeMemory` → importance/tier → `MemoryRepository.create` → chunk → embeddings (inline or queue).
- **API:** `POST /api/v1/memories/` — body: `{ content, memory_type, title? }`.
- **Storage:** `memories`, `memory_embeddings`.
- **Permissions:** Soft auth; uses `req.userId` if present.
- **Dependencies:** OpenAI embeddings, BullMQ (optional), Redis (optional).

### 3.3 Chat (RAG + Streaming)

- **Description:** Send message, get AI response using memories, KG, and conversation.
- **User Journey:** Type message → send → stream or JSON response; citations shown.
- **UI:** Chat input, message list, streaming cursor, citations, Regenerate/Accept.
- **Backend:** `ChatService.chatStream` / `chatWithContext` → `RagService.buildContext` (query rewrite, rerank, token budget) → OpenAI → return response + citations.
- **API:** `POST /api/v1/chat/` — body: `{ message, conversation_id?, stream? }`; headers: `X-Conversation-Id`, `X-Citations` (streaming).
- **Storage:** `conversation_messages`, `memories` (read), `knowledge_graph_nodes` (read), `conversation_messages` (read).
- **Permissions:** Soft auth.
- **Dependencies:** OpenAI, RAG pipeline, persona service.

### 3.4 Knowledge Graph Extraction

- **Description:** Extract entities and relationships from text via LLM.
- **User Journey:** Paste text in graph page → Extract → entities/edges added.
- **UI:** Textarea, Extract button, graph viz (zoom, search, highlight).
- **Backend:** `ExtractionService.extractFromText` → dedup → `KnowledgeGraphRepository` writes nodes/edges.
- **API:** `POST /api/v1/graph/extract` — body: `{ text }`.
- **Storage:** `knowledge_graph_nodes`, `knowledge_graph_edges`.
- **Permissions:** Soft auth.
- **Dependencies:** OpenAI, KG repository.

### 3.5 Cognitive Insights Dashboard

- **Description:** View persona metrics and productivity event counts.
- **User Journey:** Open /analytics → view persona cards and productivity chart.
- **UI:** Metric cards (tone, sentence length, vocab, sentiment, etc.), stacked bar chart (accepted/regenerated/edited).
- **Backend:** `PersonaService.getCognitiveProfile`, `AnalyticsRepository.getEventCountsByDay`.
- **API:** `GET /api/v1/persona/`, `GET /api/v1/analytics/insights?days=14`.
- **Storage:** `persona_metrics`, `user_cognitive_profiles`, `analytics_events`.
- **Permissions:** Soft auth.
- **Dependencies:** Persona, analytics repositories.

---

## 4. User Roles & Access Control

### Roles Identified

| Role | Description | Auth |
|------|-------------|------|
| Guest | Unauthenticated | No token |
| User | Authenticated | Valid JWT |

There are **no** premium, moderator, admin, or owner roles.

### Role-Permission Matrix

| Resource / Action | Guest | User |
|-------------------|-------|------|
| Health | ✅ | ✅ |
| Register / Login | ✅ | ✅ |
| GET /auth/me | ❌ (null) | ✅ |
| Create memory | ✅ (user_id=null) | ✅ (user_id set) |
| Search memories | ✅ | ✅ |
| Consolidate memories | ❌ (401) | ✅ |
| Chat | ✅ | ✅ |
| Graph nodes/edges | ✅ | ✅ |
| Graph search | ✅ | ✅ |
| Graph extract | ✅ | ✅ |
| Persona | ✅ | ✅ |
| Analytics events | ✅ | ✅ |
| Analytics insights | ✅ | ✅ |

### Access Control Implementation

- **Auth middleware:** Sets `req.userId` from JWT; `null` if missing/invalid.
- **RLS:** `app.user_id` set per request via `runWithContext`; RLS policies filter by `user_id`.
- **Per-route checks:** `POST /memories/consolidate` requires `req.userId` (401 if absent).

---

## 5. System Architecture

### 5.1 Frontend

| Aspect | Implementation |
|--------|----------------|
| Framework | Next.js 16 (App Router) |
| React | 19 |
| Styling | Tailwind CSS 4 |
| Routing | App Router: /, /login, /register, /chat, /memories, /graph, /writing, /analytics |
| State | React useState; no global store |
| UI | Custom components (Button, Input), dark theme, CSS variables |
| Graph | react-force-graph-2d |

**Component structure:**
- `layout.tsx` — layout, nav, ShortcutsProvider
- Pages — page.tsx per route
- `components/` — NavAuth, ChatMessage, ShortcutsModal, ShortcutsProvider, Button, Input
- `hooks/` — useKeyboardShortcuts, useChatShortcuts
- `lib/` — api.ts, auth (token in localStorage)

### 5.2 Backend

| Aspect | Implementation |
|--------|----------------|
| Server | Express.js |
| Modules | auth, memory, chat, graph (knowledge-graph), persona, analytics |
| Services | EmbeddingService, MemoryService, ExtractionService, PersonaService, RagService, ChatService |
| Repositories | UserRepository, MemoryRepository, ConversationRepository, KnowledgeGraphRepository, PersonaRepository, AnalyticsRepository |
| Middleware | auth, validate (Zod), rate limit, runWithContext |
| Workers | BullMQ (embeddings, consolidation) |

### 5.3 Database

| Aspect | Implementation |
|--------|----------------|
| DB | PostgreSQL |
| Extensions | pgvector (1536-d) |
| Migration | node-pg-migrate |
| RLS | Tenant isolation via `app.user_id` |

**Primary tables:** users, memories, memory_embeddings, conversations, conversation_messages, knowledge_graph_nodes, knowledge_graph_edges, analytics_events, persona_metrics, user_cognitive_profiles

### 5.4 Infrastructure

| Component | Implementation |
|-----------|----------------|
| Hosting | Netlify |
| API | Netlify Functions (serverless-http) |
| Static | Next.js static export → frontend/out |
| Queue | BullMQ (Redis) |
| Cache | Redis (optional, embeddings, rate limit) |
| Worker | Separate process (`npm run worker`) |

---

## 6. Data Flow Analysis

### Chat Flow (with RAG)

```
User types message
  → Frontend: chat() or chatJson()
  → POST /api/v1/chat/
  → authMiddleware (req.userId)
  → runWithContext(userId)
  → ChatService.chatStream / chatWithContext
    → RagService.buildContext
      → MemoryService.searchMemories (semantic + FTS)
      → KnowledgeGraphRepository search
      → ConversationRepository.getRecentMessages
      → assembleUnderBudget (token limit)
    → PersonaService.getCognitiveProfile
    → buildPersonaPrompt
  → OpenAI chat.completions.create
  → Stream tokens or return JSON
  → ConversationRepository.addMessage (user + assistant)
  → PersonaService.recordWritingSample (user message)
  → Response + X-Citations (streaming) or citations in JSON
  → Frontend: display message, citations, sources
```

### Memory Creation Flow

```
User submits memory
  → POST /api/v1/memories/
  → MemoryService.storeMemory
    → computeImportance, computeTier
    → MemoryRepository.create
    → chunkText
    → (queue or inline) EmbeddingService.getEmbeddings
    → MemoryRepository.createEmbedding (per chunk)
  → Response with memory id, type, content
```

---

## 7. API Analysis

**Base URL:** `/api` (redirects to `/.netlify/functions/api`)  
**Version prefix:** `/api/v1`

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/health | No | Status, env, Redis |
| GET | /api/v1/health/ready | No | DB + Redis readiness |

### Auth

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | /auth/register | No | `{ email, password, display_name? }` | `{ access_token, token_type }` |
| POST | /auth/login | No | `{ email, password }` | `{ access_token, token_type }` |
| GET | /auth/me | Yes | - | `{ id, email, display_name }` or 401 |

### Memory

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | /memories/ | Soft | `{ content, memory_type, title? }` | `{ id, memory_type, content, title, created_at }` |
| GET | /memories/search | Soft | Query: `q`, `limit`, `memory_type`, `tier` | `[{ memory, chunk_text, score }]` |
| POST | /memories/consolidate | Yes | `{ older_than_days?, batch_limit? }` | `{ ok: true }` |

### Chat

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | /chat/ | Soft | `{ message, conversation_id?, stream? }` | JSON: `{ response, conversation_id, citations }` or SSE stream + X-Conversation-Id, X-Citations |

### Graph

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | /graph/nodes | Soft | - | `[{ id, name, node_type, ... }]` |
| GET | /graph/edges | Soft | - | `[{ id, source_id, target_id, relationship_type }]` |
| GET | /graph/search | Soft | Query: `q`, `limit` | `[{ id, name, node_type, ... }]` |
| POST | /graph/extract | Soft | `{ text }` | `{ ok: true }` |

### Persona

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | /persona/ | Soft | - | `{ tone, sentence_length_avg, ... }` |
| POST | /persona/record | Soft | `{ text }` | `{ ok: true }` |

### Analytics

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | /analytics/events | Soft | `{ event_type, payload? }` | `{ ok: true }` |
| GET | /analytics/insights | Soft | Query: `days` | `{ event_counts: [{ date, event_type, count }] }` |

**Authentication:** `Authorization: Bearer <token>`  
**Rate limits:** 100 req/min per IP (skipped for health). X-RateLimit-Limit, X-RateLimit-Remaining headers.

---

## 8. Workflow Mapping

### Account Creation

1. User navigates to /register.
2. Submits email, password, optional display_name.
3. `POST /auth/register` → bcrypt hash → insert users → JWT.
4. Client stores token in localStorage.
5. Redirect/nav to app.

### Login

1. User navigates to /login.
2. Submits email, password.
3. `POST /auth/login` → verify password → JWT.
4. Client stores token.
5. Redirect to app.

### Content Creation (Memory)

1. User submits content and type on memories page.
2. `POST /memories/` → MemoryService → create memory, chunk, embed (sync or queue).
3. Response with memory id.
4. UI refreshes or confirms.

### AI Generation (Chat)

1. User types message in chat.
2. `POST /chat/` (stream=true) or stream=false.
3. RagService builds context (memories, KG, conversation).
4. OpenAI generates response; ChatService returns stream or JSON.
5. Messages and citations stored/displayed.

### Consolidation

1. User (or cron) triggers `POST /memories/consolidate`.
2. ConsolidationWorker finds candidates (short_term, old).
3. Promotes to long_term.
4. Response `{ ok: true }`.

---

## 9. Database Schema Reconstruction

### users

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| email | varchar(255) | UNIQUE, NOT NULL |
| hashed_password | varchar(255) | NOT NULL |
| display_name | varchar(255) | |
| is_active | boolean | DEFAULT true |
| created_at, updated_at | timestamptz | NOT NULL |

### memories

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK users CASCADE |
| memory_type | memorytype | NOT NULL |
| content | text | NOT NULL |
| title | varchar(500) | |
| importance_score | real | |
| tier | varchar(50) | |
| created_at, updated_at | timestamptz | NOT NULL |

### memory_embeddings

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| memory_id | uuid | FK memories CASCADE |
| chunk_index | integer | NOT NULL |
| chunk_text | text | NOT NULL |
| embedding | vector(1536) | NOT NULL |

Index: hnsw on embedding (vector_cosine_ops).

### conversations

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK users CASCADE |
| title | varchar(500) | |
| created_at, updated_at | timestamptz | NOT NULL |

### conversation_messages

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| conversation_id | uuid | FK conversations CASCADE |
| role | messagerole | NOT NULL |
| content | text | NOT NULL |
| created_at | timestamptz | NOT NULL |

### knowledge_graph_nodes

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK users CASCADE |
| name | varchar(500) | NOT NULL |
| node_type | nodetype | DEFAULT 'OTHER' |
| description | text | |
| metadata | jsonb | |
| embedding | vector(1536) | |
| created_at, updated_at | timestamptz | NOT NULL |

### knowledge_graph_edges

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| source_id | uuid | FK nodes CASCADE |
| target_id | uuid | FK nodes CASCADE |
| relationship_type | varchar(100) | DEFAULT 'related_to' |
| created_at | timestamptz | NOT NULL |

### analytics_events

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| event_type | varchar(100) | NOT NULL |
| user_id | uuid | FK users CASCADE |
| payload | jsonb | |
| created_at | timestamptz | NOT NULL |

### persona_metrics

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK users CASCADE |
| metric_name | varchar(100) | NOT NULL |
| metric_value | real | NOT NULL |
| sample_count | integer | DEFAULT 1 |
| created_at, updated_at | timestamptz | NOT NULL |

### user_cognitive_profiles

| Field | Type | Constraints |
|-------|------|-------------|
| user_id | uuid | PK, FK users CASCADE |
| profile | jsonb | DEFAULT '{}' |
| created_at, updated_at | timestamptz | NOT NULL |

**RLS:** All tenant tables use `app.user_id` for isolation. `users` has select-own, insert (any for register), update-own.

---

## 10. Security Review

### Authentication

- **Method:** JWT (HS256), 7-day expiry.
- **Storage:** Client stores in localStorage (`weriterbrainn_token`).
- **Validation:** `authMiddleware` decodes Bearer token; sets `req.userId` or null.

**Risks:**
- JWT secret default `"change-me-in-production"` if not overridden.
- No refresh token; expiry requires re-login.
- localStorage is XSS-vulnerable; consider httpOnly cookies.

### Authorization

- Soft auth: many routes work with `userId = null` (anonymous data).
- Consolidate requires auth (401 if not logged in).
- RLS enforces tenant isolation at DB level.

### Input Validation

- Zod schemas on all major endpoints.
- Limits: message 32k chars, content 100k, text 50k.
- Type enums for memory_type, event_type, etc.

### Rate Limiting

- 100 req/min per IP (Redis or in-memory).
- Health endpoints excluded.

### Prompt Injection

- `detectInjection()` — pattern matching.
- `sanitizeUserInput()` — truncation, redaction.
- `wrapUserContent()` — clear delimiters in prompt.

**Risks:**
- Detection is heuristic; novel prompts may bypass.

### API Protection

- CORS configurable (CORS_ORIGINS).
- JSON body limit 1mb.
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.) in Netlify.

### Possible Vulnerabilities

1. **JWT secret:** Must be strong in production.
2. **Token storage:** localStorage susceptible to XSS.
3. **Anonymous access:** Memories/chat without auth can create orphan data.
4. **No CSRF:** Stateless API; CSRF less critical but consider for cookie-based auth.
5. **Prompt injection:** Pattern-based guards may miss new attack forms.

---

## 11. Performance Analysis

### Potential Bottlenecks

1. **Embedding generation:** Sync path blocks; queue preferred for scale.
2. **RAG context:** Multiple DB queries (memories, KG, conversation); consider caching hot context.
3. **Vector search:** HNSW index; ensure ef_search/ef_construction tuned for workload.
4. **Netlify Functions:** Cold starts; consider edge or dedicated API host for low latency.

### Heavy Operations

- `storeMemory` — chunking + embedding (inline or job).
- `buildContext` — query rewrite (LLM), search, rerank, assembly.
- `extractFromText` — LLM call for entities.

### Memory Usage

- Express + pg pool; typical for Node.
- In-memory rate limit store if Redis disabled.

### Scalability Limits

- Single Netlify function; no horizontal API scaling beyond Netlify.
- Worker is single process; scale by running multiple workers.
- PostgreSQL connection pooling: use Supabase pooler for serverless.

### Optimization Suggestions

1. Use Redis for rate limit and embedding cache in production.
2. Use embedding queue to avoid blocking requests.
3. Add response caching for persona/profile when unchanged.
4. Consider CDN for static assets (Netlify handles this).
5. Tune pgvector HNSW parameters for query latency vs recall.

---

## 12. Product Improvement Analysis

### UX

- Add conversation list/sidebar for chat.
- Add memory detail/edit view.
- Add loading skeletons.
- Improve error messages and retry flows.
- Add onboarding/tour for new users.

### Features

- Password reset.
- Account deletion.
- Conversation export.
- Memory export/import.
- Admin dashboard (if multi-tenant).
- Response editing with diff and re-record.

### Engineering

- Extract shared API client types.
- Add E2E tests (Playwright).
- Add API integration tests.
- Structured error codes for client handling.
- OpenTelemetry or similar for tracing.

### AI

- Fine-tune or LoRA for user-specific style.
- Feedback loop: use accepts/edits to adjust retrieval.
- Multi-modal (images, files).
- Streaming citations inline with tokens.

### Monetization

- Premium tiers (e.g., higher limits, priority).
- Usage-based billing (tokens, storage).
- Team/shared workspaces.

---

## 13. Scaling Strategy

### Short Term

1. Ensure Redis and worker in production.
2. Use Supabase pooler for DB connections.
3. Set strong JWT_SECRET and env vars.
4. Monitor rate limits and error rates.

### Medium Term

1. Add caching for persona and frequent searches.
2. Separate read replicas for analytics/insights.
3. Consider edge functions for low-latency health/me.

### Long Term

1. Dedicated API hosting for predictable latency.
2. Kafka or similar for event streaming (analytics, consolidation).
3. Multi-region deployment for global users.
4. Model caching and batch embedding for cost control.

---

*End of CTO Audit & System Blueprint*
