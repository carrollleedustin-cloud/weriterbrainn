/**
 * Narrative Intelligence Operating System — Phase 1 schema.
 * Adds: narrative_projects, narrative_objects, narrative_edges, canon_ledger_events.
 * Coexists with legacy memories + knowledge_graph for dual-write migration.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("narrative_object_type", [
    "CHARACTER",
    "EVENT",
    "SCENE",
    "CHAPTER",
    "BOOK",
    "SERIES",
    "LOCATION",
    "OBJECT",
    "FACTION",
    "PLOT_THREAD",
    "LORE_RULE",
    "SECRET",
    "THEME",
    "MOTIF",
    "EMOTIONAL_BEAT",
    "PROMISE",
    "PAYOFF",
    "CANON_FACT",
    "OTHER",
  ]);

  pgm.createType("canon_state", [
    "CONFIRMED",
    "DRAFT",
    "SPECULATIVE",
    "DEPRECATED",
    "BRANCH_ALT",
    "AMBIGUOUS",
  ]);

  pgm.createType("canon_event_type", [
    "CANON_ESTABLISHED",
    "CANON_SUPERSEDED",
    "CANON_DEPRECATED",
    "BRANCH_CREATED",
    "BRANCH_MERGED",
  ]);

  pgm.createTable("narrative_projects", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "CASCADE" },
    title: { type: "varchar(500)", notNull: true },
    branch: { type: "varchar(100)", notNull: true, default: "main" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("narrative_projects", "user_id");
  pgm.createIndex("narrative_projects", ["user_id", "branch"]);

  pgm.createTable("narrative_objects", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_projects",
      onDelete: "CASCADE",
    },
    object_type: { type: "narrative_object_type", notNull: true },
    name: { type: "varchar(500)", notNull: true },
    summary: { type: "text" },
    metadata: { type: "jsonb", default: pgm.func("'{}'") },
    canon_state: { type: "canon_state", notNull: true, default: "DRAFT" },
    source_passage: { type: "text" },
    embedding: { type: "vector(1536)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("narrative_objects", "project_id");
  pgm.createIndex("narrative_objects", ["project_id", "object_type"]);
  pgm.createIndex("narrative_objects", "name");
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS narrative_objects_embedding_idx
    ON narrative_objects USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE embedding IS NOT NULL
  `);

  pgm.createTable("narrative_edges", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_projects",
      onDelete: "CASCADE",
    },
    source_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_objects",
      onDelete: "CASCADE",
    },
    target_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_objects",
      onDelete: "CASCADE",
    },
    edge_type: { type: "varchar(100)", notNull: true, default: "related_to" },
    metadata: { type: "jsonb", default: pgm.func("'{}'") },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("narrative_edges", "project_id");
  pgm.createIndex("narrative_edges", ["source_id", "target_id", "edge_type"]);

  pgm.createTable("canon_ledger_events", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_projects",
      onDelete: "CASCADE",
    },
    event_type: { type: "canon_event_type", notNull: true },
    object_id: { type: "uuid", references: "narrative_objects", onDelete: "SET NULL" },
    payload: { type: "jsonb", default: pgm.func("'{}'") },
    source_passage: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("canon_ledger_events", "project_id");
  pgm.createIndex("canon_ledger_events", ["project_id", "created_at"]);
};

export const down = (pgm) => {
  pgm.dropTable("canon_ledger_events");
  pgm.dropTable("narrative_edges");
  pgm.dropTable("narrative_objects");
  pgm.dropTable("narrative_projects");
  pgm.dropType("canon_event_type");
  pgm.dropType("canon_state");
  pgm.dropType("narrative_object_type");
};
