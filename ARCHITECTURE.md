# WeriterBrainn – Architecture Audit & Upgrade Design

## Executive Summary

This document presents a Principal Engineer architecture review of the WeriterBrainn Personal AI Brain platform. The audit identifies architectural weaknesses and proposes a comprehensive upgrade to transform the system into a scalable, maintainable, production-grade AI platform.

---

## Part 1: Architecture Audit

### 1.1 Current State Overview

| Component | Current Implementation | Status |
|-----------|-------------------------|--------|
| Backend | Express, flat structure, routes→services→db | ⚠️ Monolithic, no separation |
| Memory | Single table, basic chunking, vector-only | ⚠️ No cognitive tiers |
| RAG | Vector search + KG keywords, fixed top-k | ⚠️ No reranking, no query rewrite |
| Knowledge Graph | LLM extraction, basic upsert | ⚠️ No deduplication, no inference |
| Persona | 2 metrics (sentence length, vocab) | ⚠️ Minimal cognitive profile |
| UI | Tailwind zinc theme, basic pages | ⚠️ Functional but not world-class |
| Infrastructure | Netlify serverless, no workers | ⚠️ No async pipelines |
| Security | JWT auth, no rate limiting | ⚠️ Gaps in protection |

### 1.2 Backend Architecture Weaknesses

- **No Clean Architecture**: Routes directly import and call services; no domain layer, no abstractions
- **Tight Coupling**: `openai.js` imports `memory.js`, `db.js`; changes ripple across the system
- **No Dependency Injection**: Hard-coded instantiations; difficult to test or swap implementations
- **Mixed Concerns**: Route handlers contain business logic (e.g., `getOrCreateConversation` in chat route)
- **No Event System**: Operations like `storeMemory` after chat are fire-and-forget; no audit trail or retries
- **Dual Backend**: Python (FastAPI) and Node coexist; Python not wired to Netlify; migration debt

### 1.3 Memory System Weaknesses

- **Single Memory Model**: All memories treated equally; no episodic vs semantic distinction
- **No Importance Scoring**: Cannot prioritize critical vs trivial memories
- **Fixed Chunking**: 500 chars, 50 overlap; no semantic or sentence-boundary chunking
- **No Summarization**: Long conversations stored as-is; no consolidation
- **No Temporal Tiers**: No short-term vs long-term memory handling
- **Metadata Underused**: `metadata` JSONB exists but is not leveraged for filtering or scoring

### 1.4 RAG Pipeline Weaknesses

- **Vector-Only Retrieval**: Misses exact keyword matches, acronyms
- **No Reranking**: Top-k by cosine similarity only; no cross-encoder or relevance scoring
- **No Query Rewriting**: User query used as-is; no expansion or clarification
- **Fixed Context Assembly**: Arbitrary limits (5 memories, 6 messages, 7 KG nodes); no token budget
- **No Metadata Filtering**: Cannot filter by memory_type, date, project
- **No Temporal Relevance**: Recent memories not weighted higher

### 1.5 Knowledge Graph Weaknesses

- **Naive Deduplication**: Case-insensitive name match only; "John" vs "John Smith"
- **No Entity Linking**: Same entity across documents not linked
- **No Relationship Inference**: Only explicit extraction; no transitive relations
- **No Timeline**: Entities lack temporal context
- **KG Search**: ILIKE only; no graph traversal or centrality

### 1.6 Persona System Weaknesses

- **Minimal Metrics**: Only `avg_sentence_length` and `vocab_complexity`
- **No Style Modeling**: Sentence structure, tone, sentiment not tracked
- **No Feedback Loop**: Persona not updated from accepted/edited responses
- **Underused in Prompts**: Persona hints appended but not deeply integrated

### 1.7 UI/UX Weaknesses

- **Generic Aesthetic**: Geist + zinc; not distinctive
- **No Keyboard Shortcuts**: Not keyboard-first
- **Limited Animations**: No fluid transitions
- **No Memory Citations**: Chat doesn't show which memories informed the response
- **No Conversation History**: Cannot browse past conversations
- **Basic Graph**: No node filtering, search, or relationship exploration UI

### 1.8 Infrastructure Weaknesses

- **No Background Workers**: Embedding, extraction block request
- **No Job Queue**: No Bull/BullMQ or similar
- **No Caching**: Every request hits DB; no Redis
- **No Structured Logging**: `console.log`/`console.error` only
- **No Retry Logic**: Transient failures not retried

### 1.9 Security Gaps

- **No Rate Limiting**: API vulnerable to abuse
- **No Input Validation**: Rely on string trim; no schema validation
- **No Prompt Injection Protection**: User content concatenated into prompts
- **API Key Optional**: `API_KEY` in .env.example but not enforced for some routes

---

## Part 2: Upgraded Architecture Design

### 2.1 Backend – Clean Architecture

```
/backend
  /src
    /modules
      /auth          – registration, login, JWT, rate limiting
      /memory        – store, search, consolidate, importance
      /ai            – embeddings, chat, RAG pipeline
      /knowledge-graph – extraction, linking, inference
      /persona       – metrics, cognitive profile
      /analytics     – events, feedback loops
    /domain          – entities, value objects (shared)
    /repositories    – data access abstractions
    /services        – application services (orchestration)
    /workers         – background jobs (embedding, consolidation)
    /lib             – db, redis, config, logger
    /utils           – helpers
```

**Principles**:
- **Dependency Rule**: Inner layers know nothing of outer; dependencies point inward
- **Repository Pattern**: All DB access via repository interfaces
- **Service Layer**: Business logic in services; routes are thin
- **Dependency Injection**: Container (e.g., Awilix) wires dependencies

### 2.2 Memory Intelligence System

**Memory Types** (aligned with cognitive science):
| Type | Description | Examples |
|------|-------------|----------|
| Episodic | Conversations, experiences | Chat turns, meetings |
| Semantic | Facts, concepts | "Python is a programming language" |
| Project | Project-specific context | Specs, tickets |
| Goal | User goals and intentions | "Launch Q2" |
| Belief | User beliefs and preferences | "Prefers dark mode" |

**Enhancements**:
- **Importance Score**: 0–1, computed from recency, user interactions, semantic salience
- **Summarization**: Long episodic memories summarized; original retained
- **Consolidation Pipeline**: Nightly job merges related memories
- **Tiers**: Short-term (recent, high importance) vs long-term (consolidated, archival)

### 2.3 Advanced RAG Pipeline

```
User Query → Query Rewrite → Hybrid Retrieval → Rerank → Context Assembly → LLM
```

- **Query Rewrite**: Expand query (synonyms, clarification) via LLM
- **Hybrid**: Vector search + full-text (tsvector) + metadata filters
- **Rerank**: Cross-encoder or LLM-based relevance scoring
- **Context Assembly**: Token budget, priority ordering, deduplication

### 2.4 Knowledge Graph Intelligence

- **Entity Linking**: Embedding similarity + name normalization to merge entities
- **Deduplication**: Fuzzy match, alias resolution
- **Relationship Inference**: Transitive closure, co-occurrence
- **Timeline Extraction**: LLM extracts dates; store in metadata

### 2.5 Persona – User Cognitive Profile

- **Expanded Metrics**: Sentence structure, vocabulary, tone, sentiment, formality
- **Writing Samples**: From chat accepted messages, writing workspace
- **Profile Storage**: JSONB `cognitive_profile` with structured schema

### 2.6 Self-Improving AI Layer

- **Feedback Tables**: `response_feedback` (accepted, regenerated, edited)
- **Analytics**: Track which retrieval strategies led to accepted answers
- **Improvement Loop**: Periodic analysis → prompt/config tuning

---

## Part 3: New Folder Structure

```
weriterbrainn/
├── backend/                    # Refactored Node API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── memory/
│   │   │   ├── ai/
│   │   │   ├── knowledge-graph/
│   │   │   ├── persona/
│   │   │   └── analytics/
│   │   ├── domain/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── lib/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       │   ├── ui/           # Design system
│       │   ├── chat/
│       │   ├── memories/
│       │   ├── graph/
│       │   └── writing/
│       └── lib/
├── migrations/                # Consolidated (Prisma or raw SQL)
├── shared/                    # Shared types, constants
├── package.json
└── ARCHITECTURE.md
```

---

## Part 4: Implementation Roadmap

### Phase 1: Backend Clean Architecture (Weeks 1–2)
- [ ] Create `backend/` with modular structure
- [ ] Implement repository pattern for core entities
- [ ] Introduce service layer and DI container
- [ ] Migrate routes to new structure
- [ ] Maintain API compatibility

### Phase 2: Memory Intelligence (Weeks 2–3)
- [ ] Add memory types, importance score column
- [ ] Implement importance scoring logic
- [ ] Add summarization service
- [ ] Consolidation worker (optional async)

### Phase 3: Advanced RAG (Weeks 3–4)
- [ ] Hybrid retrieval (vector + tsvector)
- [ ] Query rewrite module
- [ ] Reranking (cross-encoder or simple heuristic)
- [ ] Token-aware context assembly

### Phase 4: Knowledge Graph Upgrade (Week 4–5)
- [ ] Entity linking and deduplication
- [ ] Relationship inference
- [ ] Timeline metadata

### Phase 5: Persona & Feedback (Week 5)
- [ ] Expand persona metrics
- [ ] Cognitive profile schema
- [ ] Response feedback tables and handlers

### Phase 6: UI/UX World-Class (Weeks 5–7)
- [ ] Design system (typography, colors, components)
- [ ] Chat workspace overhaul (citations, edit, regenerate)
- [ ] Memory Explorer (timeline, tags, clusters)
- [ ] Knowledge Graph Explorer (filtering, search)
- [ ] Writing Workspace enhancements
- [ ] Cognitive Insights Dashboard

### Phase 7: Infrastructure & Security (Weeks 7–8)
- [ ] Redis caching
- [ ] Background workers + job queue
- [ ] Rate limiting
- [ ] Structured logging
- [ ] Input validation & prompt injection protection

---

## Part 5: Migration Strategy

1. **Incremental**: New backend lives alongside `server/`; switch via config
2. **DB**: Add columns/tables via migrations; no breaking changes
3. **API**: Maintain `/api/v1` contract; extend with new endpoints
4. **Frontend**: Gradual component replacement; feature flags if needed
