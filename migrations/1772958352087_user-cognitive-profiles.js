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
  pgm.createTable("user_cognitive_profiles", {
    user_id: {
      type: "uuid",
      primaryKey: true,
      references: "users",
      onDelete: "CASCADE",
    },
    profile: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.sql("ALTER TABLE user_cognitive_profiles ENABLE ROW LEVEL SECURITY");
  pgm.sql(`
    CREATE POLICY user_cognitive_profiles_tenant ON user_cognitive_profiles
    FOR ALL USING (user_id = current_setting('app.user_id', true)::uuid)
    WITH CHECK (user_id = current_setting('app.user_id', true)::uuid)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql("DROP POLICY IF EXISTS user_cognitive_profiles_tenant ON user_cognitive_profiles");
  pgm.dropTable("user_cognitive_profiles", { ifExists: true });
};
