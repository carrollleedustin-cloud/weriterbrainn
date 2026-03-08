# WeriterBrainn — Architecture Audit & Upgrade Design

**Principal Engineer Technical Audit**  
**Date:** March 2025  
**Scope:** Full technical audit, redesign, and upgrade to production-grade AI platform

---

## Executive Summary

The current WeriterBrainn system is a functional MVP with solid foundations: modular server structure, repository pattern, domain constants, RLS, and a coherent UI. However, significant gaps exist for scalability, cognitive depth, retrieval quality, and production robustness. This audit identifies weaknesses and proposes an upgraded architecture to transform the platform into a world-class Personal AI Brain.

---

## 1. Architecture Audit

### 1.1 Current State

| Layer | Implementation | Assessment |
|-------|----------------|-----------|
| **Backend** | Express, server/src (services, repositories, modules) | Good modular structure; mixed with legacy server/routes |
| **Database** | PostgreSQL, pgvector, node-pg-migrate, RLS | Solid; embedding dim mismatch (config says 3072, schema 1536) |
| **AI** | OpenAI embeddings + chat, basic RAG | Functional but minimal—no hybrid search, reranking, or query rewriting |
| **Memory** | Single-tier, chunked embeddings, importance heuristic | No episodic vs semantic distinction, no consolidation pipeline |
| **Knowledge Graph** | Entity extraction, ILIKE search | No entity dedup, relationship inference, or timeline extraction |
| **Persona** | avg_sentence_length, vocab_complexity | Minimal; no tone, sentiment, or communication style tracking |
| **Infrastructure** | Netlify serverless (netlify.toml), no functions directory | API deployment path unclear; no job queues, Redis |
| **Frontend** | Next.js 16, React 19, Tailwind 4, custom design system | Good dark theme; missing keyboard-first, memory citations, graph viz |
| **Testing** | Jest, minimal tests | Coverage gaps; no API integration tests in CI |
| **Security** | JWT, rate limit, CORS | Basic; no prompt injection protection, input validation libs |

### 1.2 Identified Weaknesses

1. **Backend**
   - Duplication: `server/routes/` vs `server/src/modules/` (legacy vs modular)
   - No dependency injection beyond manual container wiring
   - Embedding sync in request path (storeMemory blocks on embeddings)
   - No background workers or job queues
   - Config `embeddingDim: 3072` vs schema `vector(1536)` — inconsistency

2. **Memory System**
   - Flat memory model; no episodic vs semantic separation
   - Importance scoring is heuristic-only; no LLM-based scoring
   - No summarization or consolidation pipelines
   - No temporal decay or recency weighting in retrieval
   - Tier logic inverted (high importance → short_term)

3. **Retrieval**
   - Pure vector search; no keyword/BM25 hybrid
   - No reranking
   - No query expansion or rewriting
   - No metadata filtering (memory_type, tier, date range)
   - Context assembly is naive concatenation; no token budgeting

4. **Knowledge Graph**
   - No entity linking or deduplication
   - No relationship inference
   - No timeline extraction
   - Entity search is ILIKE only; no semantic entity retrieval

5. **Persona**
   - Only 2 metrics; no tone, sentiment, or style modeling
   - No User Cognitive Profile structure
   - Persona not used for response adaptation beyond hints

6. **AI Layer**
   - No feedback loop for edits, accepts, regenerates
   - System prompt is static
   - No prompt injection protection

7. **Infrastructure**
   - No Redis for caching
   - No job queues ( BullMQ, etc.)
   - Netlify functions directory missing (API may run via different path)
   - No structured logging (Winston/Pino)

8. **UI/UX**
   - No keyboard shortcuts
   - No memory citations in chat
   - No react-force-graph usage (package present, graph page basic)
   - Writing workspace not integrated with persona

---

## 2. Upgraded Architecture Design

### 2.1 Target Backend Structure

```
/backend
  /src
    /modules
      /auth
      /memory
      /ai
      /knowledge-graph
      /persona
      /analytics
    /services
      /memory
      /retrieval
      /ai
      /knowledge-graph
      /persona
    /repositories
    /domain
    /workers
    /lib
    /utils
```

- **Service layer**: Orchestrates domain logic; calls repositories and external APIs
- **Repository pattern**: Data access only; no business rules
- **Domain layer**: Entities, value objects, invariants
- **Workers**: Background jobs for embeddings, consolidation, extraction

### 2.2 Memory Intelligence Engine

| Memory Type | Description | Storage |
|-------------|-------------|---------|
| Episodic | Conversations, events | Dedicated table or flag |
| Semantic | Facts, beliefs | `memory_type` + content |
| Project | Project-related context | `memory_type = PROJECT` |
| Goal | Goals and objectives | `memory_type = GOAL` |
| Belief | Core beliefs | `memory_type = BELIEF` |

- **Importance scoring**: Heuristic + optional LLM pass for high-value content
- **Tiers**: `short_term` (hot, recent) vs `long_term` (consolidated)
- **Consolidation pipeline**: Async worker; merges/summarizes older memories
- **Temporal decay**: Apply recency boost in retrieval scoring

### 2.3 Advanced Retrieval System

- **Hybrid**: Vector (pgvector) + full-text search (tsvector/tsquery)
- **Reranking**: Optional cross-encoder or LLM rerank for top-K
- **Query rewriting**: Expand/rewrite user query for better recall
- **Metadata filters**: memory_type, tier, date range
- **Token-efficient context**: Sliding window, truncation, priority ordering

### 2.4 Knowledge Graph Intelligence

- **Entity linking**: Match extracted entities to existing nodes (fuzzy + semantic)
- **Deduplication**: Merge duplicate entities
- **Relationship inference**: Infer edges from co-occurrence, embeddings
- **Timeline extraction**: Extract temporal events for graph

### 2.5 Persona / Cognitive Profile

- **Metrics**: sentence_length, vocab_complexity, tone (formal/casual), sentiment, preferred_length
- **User Cognitive Profile**: Structured JSON per user
- **Adaptation**: Inject profile into system prompt for style mimicry

### 2.6 Self-Improving AI Layer

- **Feedback events**: response_accepted, response_regenerated, response_edited
- **Storage**: analytics_events with payload (message_id, edit_diff, etc.)
- **Use**: Train retrieval weights, prompt variants, formatting preferences (future)

### 2.7 Infrastructure Additions

- **Redis**: Cache embeddings, frequent queries, rate limit state
- **Job queue**: BullMQ + Redis for embedding, consolidation, extraction jobs
- **Structured logging**: Pino with request IDs
- **Health checks**: DB, Redis, OpenAI connectivity

### 2.8 Security Enhancements

- **Input validation**: Zod (or similar) on all API payloads
- **Prompt injection**: Detect and truncate suspicious patterns; system prompt guardrails
- **Rate limiting**: Per-user, per-endpoint; stricter on AI routes

---

## 3. New Folder Structure (Target)

```
/weriterbrainn
  /server                    # Primary API (Express)
    /src
      /modules               # Route handlers
        /auth
        /memory
        /chat
        /graph
        /persona
        /analytics
      /services              # Domain services
      /repositories          # Data access
      /domain                # Entities, constants
      /workers               # Background job handlers
      /lib                   # db, config, logger, requestContext
      /middleware            # auth, rateLimit, validate
  /frontend
    /src
      /app
      /components
      /lib
  /migrations
  /netlify
    /functions              # Netlify serverless entry (if used)
  /docs
```

---

## 4. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–2)
- [x] Architecture audit document
- [ ] Fix embedding dim consistency (1536 vs 3072)
- [ ] Consolidate routes (remove legacy server/routes)
- [ ] Add Zod validation to memory, chat, graph endpoints
- [ ] Add hybrid retrieval (vector + tsvector)
- [ ] Add metadata filtering to memory search
- [ ] Async embedding pipeline (queue job instead of inline)

### Phase 2 — Memory Intelligence (Weeks 2–3)
- [ ] Memory importance scoring refinement
- [ ] Temporal relevance in retrieval
- [ ] Memory type–aware context assembly
- [ ] Consolidation worker stub

### Phase 3 — RAG & AI (Weeks 3–4)
- [ ] Query rewriting (optional)
- [ ] Reranking (optional cross-encoder)
- [ ] Token-efficient context assembly
- [ ] Prompt injection guards

### Phase 4 — Knowledge Graph (Weeks 4–5)
- [ ] Entity deduplication
- [ ] Relationship inference
- [ ] Timeline extraction
- [ ] Semantic entity search

### Phase 5 — Persona (Week 5–6)
- [ ] Expanded persona metrics
- [ ] User Cognitive Profile schema
- [ ] Persona-driven prompt adaptation

### Phase 6 — Infrastructure (Weeks 6–7)
- [ ] Redis integration
- [ ] Job queue (BullMQ)
- [ ] Structured logging (Pino)
- [ ] Netlify functions wiring

### Phase 7 — UI/UX (Weeks 7–8)
- [ ] Memory citations in chat
- [ ] Knowledge graph visualization (react-force-graph)
- [ ] Keyboard shortcuts
- [ ] Cognitive Insights dashboard

---

## 5. Phase 1 Implementation Plan

Phase 1 focuses on:
1. Cleaning up backend structure
2. Correcting config/schema mismatch
3. Adding input validation (Zod)
4. Implementing hybrid retrieval (vector + full-text)
5. Adding metadata filters to search
6. Preparing for async embedding (interface only; sync fallback)

Next: Begin Phase 1 implementation.
