/**
 * Canon Facts — structured truth layer with provenance.
 * Coexists with canon_ledger_events (event-sourced audit). Facts are queryable truth.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("canon_fact_type", [
    "CHARACTER_STATE",
    "EVENT_OCCURRED",
    "RELATIONSHIP",
    "LORE",
    "SECRET",
    "TIMELINE",
    "KNOWLEDGE_STATE",
    "PLOT_THREAD_STATUS",
    "OTHER",
  ]);

  pgm.createTable("canon_facts", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_projects",
      onDelete: "CASCADE",
    },
    branch_id: { type: "varchar(100)", default: "main" },
    fact_type: { type: "canon_fact_type", notNull: true, default: "OTHER" },
    fact_value: { type: "text", notNull: true },
    entity_ids: { type: "jsonb", default: pgm.func("'[]'") },
    source_text: { type: "text" },
    source_object_id: { type: "uuid", references: "narrative_objects", onDelete: "SET NULL" },
    source_passage: { type: "text" },
    provenance: { type: "jsonb", default: pgm.func("'{}'") },
    confidence: { type: "float", notNull: true, default: 0.8 },
    canon_state: { type: "canon_state", notNull: true, default: "DRAFT" },
    supersedes_id: { type: "uuid", references: "canon_facts", onDelete: "SET NULL" },
    superseded_by_id: { type: "uuid", references: "canon_facts", onDelete: "SET NULL" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("canon_facts", "project_id");
  pgm.createIndex("canon_facts", ["project_id", "canon_state"]);
  pgm.createIndex("canon_facts", ["project_id", "fact_type"]);
  pgm.createIndex("canon_facts", "source_object_id");
};

export const down = (pgm) => {
  pgm.dropTable("canon_facts");
  pgm.dropType("canon_fact_type");
};
