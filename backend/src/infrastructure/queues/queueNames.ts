export const QueueNames = {
  Embeddings: 'embeddings',
  Importance: 'importance-score',
  ConsolidateMemory: 'consolidate-memory',
  KnowledgeGraph: 'knowledge-graph',
  Persona: 'persona-profile',
  Analytics: 'analytics',
  Feedback: 'feedback',
} as const;

export type QueueName = typeof QueueNames[keyof typeof QueueNames];
