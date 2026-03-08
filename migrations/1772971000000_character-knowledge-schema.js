/**
 * Character knowledge state — who knows what, when.
 * Supports secret propagation maps and knowledge-aware reasoning.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("knowledge_assertion_type", [
    "KNOWS",
    "SUSPECTS",
    "DOES_NOT_KNOW",
    "REVEALED_TO",
    "LEARNED_IN",
  ]);

  pgm.createTable("character_knowledge", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_projects",
      onDelete: "CASCADE",
    },
    character_id: {
      type: "uuid",
      notNull: true,
      references: "narrative_objects",
      onDelete: "CASCADE",
    },
    fact_key: { type: "varchar(500)", notNull: true },
    assertion_type: { type: "knowledge_assertion_type", notNull: true },
    confidence: { type: "float", notNull: true, default: 0.8 },
    source_passage: { type: "text" },
    source_object_id: { type: "uuid", references: "narrative_objects", onDelete: "SET NULL" },
    provenance: { type: "jsonb", default: pgm.func("'{}'") },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("character_knowledge", "project_id");
  pgm.createIndex("character_knowledge", ["project_id", "character_id"]);
  pgm.createIndex("character_knowledge", ["project_id", "fact_key"]);
};

export const down = (pgm) => {
  pgm.dropTable("character_knowledge");
  pgm.dropType("knowledge_assertion_type");
};
