-- Supabase bootstrap schema for WeriterBrainn
-- Run in Supabase SQL editor with owner privileges.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memorytype') THEN
    CREATE TYPE public.memorytype AS ENUM (
      'CONVERSATION',
      'NOTE',
      'IDEA',
      'DOCUMENT',
      'PROJECT',
      'BELIEF',
      'GOAL'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messagerole') THEN
    CREATE TYPE public.messagerole AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nodetype') THEN
    CREATE TYPE public.nodetype AS ENUM ('PERSON', 'CONCEPT', 'PROJECT', 'EVENT', 'OTHER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  hashed_password varchar(255) NOT NULL,
  display_name varchar(255),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email_index ON public.users (email);

CREATE TABLE IF NOT EXISTS public.memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  memory_type public.memorytype NOT NULL,
  content text NOT NULL,
  title varchar(500),
  importance_score real,
  tier varchar(50),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS memories_user_id_index ON public.memories (user_id);
CREATE INDEX IF NOT EXISTS memories_created_at_index ON public.memories (created_at);

CREATE TABLE IF NOT EXISTS public.memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX IF NOT EXISTS memory_embeddings_memory_id_index ON public.memory_embeddings (memory_id);
CREATE INDEX IF NOT EXISTS memory_embeddings_embedding_idx ON public.memory_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  title varchar(500),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_user_id_index ON public.conversations (user_id);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations ON DELETE CASCADE,
  role public.messagerole NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS conversation_messages_conversation_id_index ON public.conversation_messages (conversation_id);

CREATE TABLE IF NOT EXISTS public.knowledge_graph_nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  name varchar(500) NOT NULL,
  node_type public.nodetype DEFAULT 'OTHER' NOT NULL,
  description text,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS knowledge_graph_nodes_user_id_index ON public.knowledge_graph_nodes (user_id);
CREATE INDEX IF NOT EXISTS knowledge_graph_nodes_name_index ON public.knowledge_graph_nodes (name);
CREATE INDEX IF NOT EXISTS knowledge_graph_nodes_embedding_idx ON public.knowledge_graph_nodes
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.knowledge_graph_edges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.knowledge_graph_nodes ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.knowledge_graph_nodes ON DELETE CASCADE,
  relationship_type varchar(100) DEFAULT 'related_to' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS knowledge_graph_edges_source_id_target_id_index
  ON public.knowledge_graph_edges (source_id, target_id);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type varchar(100) NOT NULL,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  payload jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_events_user_id_index ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_index ON public.analytics_events (created_at);

CREATE TABLE IF NOT EXISTS public.persona_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users ON DELETE CASCADE,
  metric_name varchar(100) NOT NULL,
  metric_value real NOT NULL,
  sample_count integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS persona_metrics_user_id_index ON public.persona_metrics (user_id);

CREATE TABLE IF NOT EXISTS public.user_cognitive_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users ON DELETE CASCADE,
  profile jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_cognitive_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_cognitive_profiles' AND policyname = 'user_cognitive_profiles_tenant'
  ) THEN
    CREATE POLICY user_cognitive_profiles_tenant ON public.user_cognitive_profiles
      FOR ALL
      USING (user_id = current_setting('app.user_id', true)::uuid)
      WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);
  END IF;
END $$;

-- Row Level Security (tenant isolation)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_own'
  ) THEN
    CREATE POLICY users_select_own ON public.users
      FOR SELECT USING (
        id = current_setting('app.user_id', true)::uuid
        OR current_setting('app.user_id', true) IS NULL
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_insert'
  ) THEN
    CREATE POLICY users_insert ON public.users
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_own'
  ) THEN
    CREATE POLICY users_update_own ON public.users
      FOR UPDATE USING (id = current_setting('app.user_id', true)::uuid);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'memories' AND policyname = 'memories_tenant'
  ) THEN
    CREATE POLICY memories_tenant ON public.memories
      FOR ALL
      USING (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      )
      WITH CHECK (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'memory_embeddings' AND policyname = 'memory_embeddings_tenant'
  ) THEN
    CREATE POLICY memory_embeddings_tenant ON public.memory_embeddings
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.memories m
          WHERE m.id = memory_id AND (
            m.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND m.user_id = current_setting('app.user_id')::uuid)
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.memories m
          WHERE m.id = memory_id AND (
            m.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND m.user_id = current_setting('app.user_id')::uuid)
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_tenant'
  ) THEN
    CREATE POLICY conversations_tenant ON public.conversations
      FOR ALL
      USING (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      )
      WITH CHECK (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_messages' AND policyname = 'conversation_messages_tenant'
  ) THEN
    CREATE POLICY conversation_messages_tenant ON public.conversation_messages
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = conversation_id AND (
            c.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND c.user_id = current_setting('app.user_id')::uuid)
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = conversation_id AND (
            c.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND c.user_id = current_setting('app.user_id')::uuid)
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_graph_nodes' AND policyname = 'knowledge_graph_nodes_tenant'
  ) THEN
    CREATE POLICY knowledge_graph_nodes_tenant ON public.knowledge_graph_nodes
      FOR ALL
      USING (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      )
      WITH CHECK (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'knowledge_graph_edges' AND policyname = 'knowledge_graph_edges_tenant'
  ) THEN
    CREATE POLICY knowledge_graph_edges_tenant ON public.knowledge_graph_edges
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.knowledge_graph_nodes n
          WHERE (n.id = source_id OR n.id = target_id) AND (
            n.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND n.user_id = current_setting('app.user_id')::uuid)
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.knowledge_graph_nodes n
          WHERE (n.id = source_id OR n.id = target_id) AND (
            n.user_id IS NULL OR
            (current_setting('app.user_id', true) IS NOT NULL AND n.user_id = current_setting('app.user_id')::uuid)
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'analytics_events' AND policyname = 'analytics_events_tenant'
  ) THEN
    CREATE POLICY analytics_events_tenant ON public.analytics_events
      FOR ALL
      USING (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      )
      WITH CHECK (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'persona_metrics' AND policyname = 'persona_metrics_tenant'
  ) THEN
    CREATE POLICY persona_metrics_tenant ON public.persona_metrics
      FOR ALL
      USING (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      )
      WITH CHECK (
        (user_id IS NULL) OR
        (current_setting('app.user_id', true) IS NOT NULL AND user_id = current_setting('app.user_id')::uuid)
      );
  END IF;
END $$;
