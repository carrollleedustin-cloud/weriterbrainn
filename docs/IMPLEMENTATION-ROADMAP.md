# WeriterBrainn — Implementation Roadmap

Execution plan derived from [ARCHITECTURE-AUDIT.md](./ARCHITECTURE-AUDIT.md).

---

## Phase 1 — Foundation (Current)

| Task | Status | Notes |
|------|--------|-------|
| Architecture audit document | ✅ Done | docs/ARCHITECTURE-AUDIT.md |
| Fix embedding dim consistency | ✅ Done | Config uses 1536 (text-embedding-3-small); EMBEDDING_DIM env override |
| Consolidate routes | Deferred | Legacy server/routes not in use; app uses server/src/modules |
| Add Zod validation | ✅ Done | All endpoints: memory, chat, graph, persona, analytics, auth |
| Hybrid retrieval (vector + FTS) | ✅ Done | MemoryRepository combines vector + ts_rank when query text present |
| Metadata filters on search | ✅ Done | memory_type, tier in search API and frontend |
| Async embedding pipeline prep | Deferred | Phase 2; job queue integration planned |

---

## Phase 2 — Memory Intelligence ✅

| Task | Status |
|------|--------|
| Memory importance scoring refinement | ✅ Content signals (I believe, my goal, etc.), semantic vs episodic tier logic |
| Temporal relevance in retrieval | ✅ Recency boost: +10% (7d), +5% (30d) |
| Memory type-aware context assembly | ✅ Priority order: belief > goal > project > idea > note > conversation; type labels |
| Consolidation worker stub | ✅ `POST /api/v1/memories/consolidate`; promotes old short_term → long_term |

---

## Phase 3 — RAG & AI ✅

| Task | Status |
|------|--------|
| Query rewriting (optional) | ✅ `rewriteQueryForRetrieval()` via LLM; env `QUERY_REWRITE=false` to disable |
| Reranking (optional) | ✅ `diversityRerank()` MMR-like; env `RERANK=false` to disable |
| Token-efficient context assembly | ✅ `assembleUnderBudget()`, `MAX_CONTEXT_TOKENS` (default 3500) |
| Prompt injection guards | ✅ `sanitizeUserInput()`, `wrapUserContent()`, `detectInjection()`; delimiters in prompt |

---

## Phase 4 — Knowledge Graph ✅

| Task | Status |
|------|--------|
| Entity deduplication | ✅ `nameSimilarity()` token overlap; merge similar names (threshold 0.82) |
| Relationship inference | ✅ Co-occurrence: add `related_to` for entity pairs (max 15) |
| Timeline extraction | ✅ Extraction prompt asks for `temporal`; stored in `metadata.temporal` |
| Semantic entity search | ✅ `searchEntitiesSemantic()`; node embeddings; `GET /graph/search?q=` |

---

## Phase 5 — Persona ✅

| Task | Status |
|------|--------|
| Expanded persona metrics | ✅ tone_score, sentiment_avg, question_ratio, exclamation_ratio, avg_message_length |
| User Cognitive Profile schema | ✅ user_cognitive_profiles table; profile jsonb; buildCognitiveProfile() |
| Persona-driven prompt adaptation | ✅ buildPersonaPrompt(); tone, length, questions, sentiment; chat auto-records samples |

---

## Phase 6 — Infrastructure ✅

| Task | Status |
|------|--------|
| Redis integration | ✅ lib/redis.js; embedding cache; Redis-backed rate limit |
| Job queue (BullMQ) | ✅ lib/queue.js; server/worker.js (embeddings, consolidation); `npm run worker` |
| Structured logging (Pino) | ✅ logger.js uses Pino; pino-pretty in dev |
| Netlify functions wiring | ✅ api.mjs; pgvector, ioredis, bullmq in external_node_modules |

---

## Phase 7 — UI/UX ✅

| Task | Status |
|------|--------|
| Memory citations in chat | ✅ Numbered citations [1], [2]; sources panel; X-Citations header for streaming |
| Knowledge graph visualization | ✅ react-force-graph-2d: search, highlight, zoom controls, directional arrows |
| Keyboard shortcuts | ✅ ⌘K focus chat, ⌘1–6 nav, ⌘Enter send, ? help modal |
| Cognitive Insights dashboard | ✅ Productivity patterns (event timeline), persona metrics, legend |

---

## NIOS — Narrative Intelligence Operating System

### Phase 1 — Narrative Core ✅

| Task | Status |
|------|--------|
| Narrative universe schema | ✅ narrative_projects, narrative_objects, narrative_edges, canon_ledger_events |
| Domain constants | ✅ Object types, canon states, edge types |
| NarrativeRepository | ✅ CRUD for projects, objects, edges; canon ledger events |
| Extended extraction pipeline | ✅ entities, events, plot_threads, canon_facts, emotional_beats, relationships |
| NarrativeExtractionService | ✅ extractAndIngest; dual-path to narrative model |
| API routes | ✅ POST /narrative/extract, GET /narrative/project, objects, edges |
| Story Universe page | ✅ /universe — extract, view graph, object counts |

### Phase 2 — Canon Intelligence ✅

| Task | Status |
|------|--------|
| Story Compiler | ✅ validate new text vs canon; tiers: soft_risk, likely_contradiction, canon_break |
| Continuity Guardian | ✅ compile alerts with suggested resolution |
| Timeline + causality | ✅ TimelineService; events ordered; caused_by |
| Plot Thread intelligence | ✅ PlotThreadService; lifecycle, related events |
| API routes | ✅ POST /compile, GET /timeline, /plot-threads |
| Universe tabs | ✅ Compile, Timeline, Plot Threads, Strategy, Story Q&A |

### Phase 3 — Character + Voice ✅

| Task | Status |
|------|--------|
| Character models | ✅ CharacterService; goals, fears, knowledge from LLM |
| Narrative context in RAG | ✅ buildNarrativeSummary; story universe in chat context |
| Cast page | ✅ /cast — character list, detail view with goals/fears/relationships |

### Phase 4 — Interface ✅

| Task | Status |
|------|--------|
| Pulse | ✅ /pulse — living overview, active threads, strategy |
| Cast | ✅ /cast — character intelligence |
| Universe | ✅ tabs: Universe, Compile, Timeline, Threads, Strategy, Q&A |
| Nav | ✅ Pulse, Universe, Cast in layout |

### Phase 5 — Simulation + Strategy ✅

| Task | Status |
|------|--------|
| Story Q&A | ✅ narrativeAsk; natural language over universe; citations |
| Story Strategist | ✅ getStrategy; suggestions, opportunities |
| Consequence Preview | ✅ ConsequencePreviewService; impacts, severity |
| API routes | ✅ GET /ask, /strategy; POST /preview |

### Phase 6 — Polish ✅

| Task | Status |
|------|--------|
| Home page | ✅ Pulse, Universe, Cast cards; NIOS entry points |
| Consequence Preview UI | ✅ Preview button in Compile tab |
