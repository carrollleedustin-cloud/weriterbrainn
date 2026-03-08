/**
 * Initial schema: users, memories, embeddings, conversations, graph, analytics, persona.
 * Reversible migration with RLS for tenant isolation.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql("CREATE EXTENSION IF NOT EXISTS vector");

  pgm.createType("memorytype", [
    "CONVERSATION",
    "NOTE",
    "IDEA",
    "DOCUMENT",
    "PROJECT",
    "BELIEF",
    "GOAL",
  ]);
  pgm.createType("messagerole", ["USER", "ASSISTANT", "SYSTEM"]);
  pgm.createType("nodetype", ["PERSON", "CONCEPT", "PROJECT", "EVENT", "OTHER"]);

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    email: { type: "varchar(255)", notNull: true, unique: true },
    hashed_password: { type: "varchar(255)", notNull: true },
    display_name: { type: "varchar(255)" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("users", "email");

  pgm.createTable("memories", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    memory_type: { type: "memorytype", notNull: true },
    content: { type: "text", notNull: true },
    title: { type: "varchar(500)" },
    importance_score: { type: "real" },
    tier: { type: "varchar(50)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("memories", "user_id");
  pgm.createIndex("memories", "created_at");

  pgm.sql(`
    CREATE TABLE memory_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      chunk_index integer NOT NULL,
      chunk_text text NOT NULL,
      embedding vector(3072) NOT NULL
    )
  `);
  pgm.createIndex("memory_embeddings", "memory_id");
  pgm.sql(`
    CREATE INDEX memory_embeddings_embedding_idx ON memory_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `);

  pgm.createTable("conversations", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    title: { type: "varchar(500)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("conversations", "user_id");

  pgm.createTable("conversation_messages", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    conversation_id: {
      type: "uuid",
      notNull: true,
      references: "conversations",
      onDelete: "CASCADE",
    },
    role: { type: "messagerole", notNull: true },
    content: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("conversation_messages", "conversation_id");

  pgm.createTable("knowledge_graph_nodes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    name: { type: "varchar(500)", notNull: true },
    node_type: { type: "nodetype", notNull: true, default: "OTHER" },
    description: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("knowledge_graph_nodes", "user_id");
  pgm.createIndex("knowledge_graph_nodes", "name");

  pgm.createTable("knowledge_graph_edges", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    source_id: {
      type: "uuid",
      notNull: true,
      references: "knowledge_graph_nodes",
      onDelete: "CASCADE",
    },
    target_id: {
      type: "uuid",
      notNull: true,
      references: "knowledge_graph_nodes",
      onDelete: "CASCADE",
    },
    relationship_type: { type: "varchar(100)", notNull: true, default: "related_to" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("knowledge_graph_edges", ["source_id", "target_id"]);

  pgm.createTable("analytics_events", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    event_type: { type: "varchar(100)", notNull: true },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    payload: { type: "jsonb" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("analytics_events", "user_id");
  pgm.createIndex("analytics_events", "created_at");

  pgm.createTable("persona_metrics", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" },
    metric_name: { type: "varchar(100)", notNull: true },
    metric_value: { type: "real", notNull: true },
    sample_count: { type: "integer", notNull: true, default: 1 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("persona_metrics", "user_id");

  // RLS for tenant isolation. App must SET LOCAL app.user_id = :userId per request.
  const rlsTables = [
    "users",
    "memories",
    "memory_embeddings",
    "conversations",
    "conversation_messages",
    "knowledge_graph_nodes",
    "knowledge_graph_edges",
    "analytics_events",
    "persona_metrics",
  ];
  for (const table of rlsTables) {
    pgm.sql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }

  pgm.sql(`
    CREATE POLICY users_select_own ON users
    FOR SELECT USING (
      id = current_setting('app.user_id', true)::uuid
      OR current_setting('app.user_id', true) IS NULL
    );
    CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (true);
    CREATE POLICY users_update_own ON users
    FOR UPDATE USING (id = current_setting('app.user_id', true)::uuid);
  `);
  pgm.sql(`
    CREATE POLICY memories_tenant ON memories FOR ALL
    USING (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    )
    WITH CHECK (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    );
  `);
  pgm.sql(`
    CREATE POLICY memory_embeddings_tenant ON memory_embeddings FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM memories m
        WHERE m.id = memory_id AND (
          m.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND m.user_id = current_setting('app.user_id')::uuid)
        )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM memories m
        WHERE m.id = memory_id AND (
          m.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND m.user_id = current_setting('app.user_id')::uuid)
        )
      )
    );
  `);
  pgm.sql(`
    CREATE POLICY conversations_tenant ON conversations FOR ALL
    USING (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    )
    WITH CHECK (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    );
  `);
  pgm.sql(`
    CREATE POLICY conversation_messages_tenant ON conversation_messages FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id AND (
          c.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND c.user_id = current_setting('app.user_id')::uuid)
        )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id AND (
          c.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND c.user_id = current_setting('app.user_id')::uuid)
        )
      )
    );
  `);
  pgm.sql(`
    CREATE POLICY knowledge_graph_nodes_tenant ON knowledge_graph_nodes FOR ALL
    USING (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    )
    WITH CHECK (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    );
  `);
  pgm.sql(`
    CREATE POLICY knowledge_graph_edges_tenant ON knowledge_graph_edges FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM knowledge_graph_nodes n
        WHERE (n.id = source_id OR n.id = target_id) AND (
          n.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND n.user_id = current_setting('app.user_id')::uuid)
        )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM knowledge_graph_nodes n
        WHERE (n.id = source_id OR n.id = target_id) AND (
          n.user_id IS NULL OR
          (current_setting('app.user_id', true) IS NOT NULL AND n.user_id = current_setting('app.user_id')::uuid)
        )
      )
    );
  `);
  pgm.sql(`
    CREATE POLICY analytics_events_tenant ON analytics_events FOR ALL
    USING (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    )
    WITH CHECK (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    );
  `);
  pgm.sql(`
    CREATE POLICY persona_metrics_tenant ON persona_metrics FOR ALL
    USING (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    )
    WITH CHECK (
      (user_id IS NULL) OR
      (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
    );
  `);
};

export const down = (pgm) => {
  pgm.sql("DROP POLICY IF EXISTS users_select_own ON users");
  pgm.sql("DROP POLICY IF EXISTS users_insert ON users");
  pgm.sql("DROP POLICY IF EXISTS users_update_own ON users");
  pgm.sql("DROP POLICY IF EXISTS memories_tenant ON memories");
  pgm.sql("DROP POLICY IF EXISTS memory_embeddings_tenant ON memory_embeddings");
  pgm.sql("DROP POLICY IF EXISTS conversations_tenant ON conversations");
  pgm.sql("DROP POLICY IF EXISTS conversation_messages_tenant ON conversation_messages");
  pgm.sql("DROP POLICY IF EXISTS knowledge_graph_nodes_tenant ON knowledge_graph_nodes");
  pgm.sql("DROP POLICY IF EXISTS knowledge_graph_edges_tenant ON knowledge_graph_edges");
  pgm.sql("DROP POLICY IF EXISTS analytics_events_tenant ON analytics_events");
  pgm.sql("DROP POLICY IF EXISTS persona_metrics_tenant ON persona_metrics");

  pgm.dropTable("persona_metrics", { ifExists: true });
  pgm.dropTable("analytics_events", { ifExists: true });
  pgm.dropTable("knowledge_graph_edges", { ifExists: true });
  pgm.dropTable("knowledge_graph_nodes", { ifExists: true });
  pgm.dropTable("conversation_messages", { ifExists: true });
  pgm.dropTable("conversations", { ifExists: true });
  pgm.dropTable("memory_embeddings", { ifExists: true });
  pgm.dropTable("memories", { ifExists: true });
  pgm.dropTable("users", { ifExists: true });

  pgm.dropType("nodetype", { ifExists: true });
  pgm.dropType("messagerole", { ifExists: true });
  pgm.dropType("memorytype", { ifExists: true });

  pgm.sql("DROP EXTENSION IF EXISTS vector");
};
