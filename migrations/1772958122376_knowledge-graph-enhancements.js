/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns("knowledge_graph_nodes", {
    metadata: { type: "jsonb" },
    embedding: { type: "vector(1536)" },
  });
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS knowledge_graph_nodes_embedding_idx
    ON knowledge_graph_nodes USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    WHERE embedding IS NOT NULL
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql("DROP INDEX IF EXISTS knowledge_graph_nodes_embedding_idx");
  pgm.dropColumns("knowledge_graph_nodes", ["metadata", "embedding"]);
};
