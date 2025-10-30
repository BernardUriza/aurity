/**
 * Interaction Types
 * Card: FI-UI-FEAT-205
 */

export interface Interaction {
  id: string;
  session_id: string;
  index: number;
  prompt: string;
  response: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at?: string;
  latency_ms?: number;
  tokens_in?: number;
  tokens_out?: number;
  content_hash: string;
  manifest_hash?: string;
  metadata?: Record<string, any>;
}

export interface InteractionExport {
  format: "json" | "markdown";
  interaction: Interaction;
}
