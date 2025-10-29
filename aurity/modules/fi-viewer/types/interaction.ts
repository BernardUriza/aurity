/**
 * FI-VIEWER Module - Interaction Types
 *
 * TypeScript interfaces for Free Intelligence interactions
 * Maps to backend corpus_ops.py schema
 */

export interface Interaction {
  // Primary identifiers
  interaction_id: string;        // UUID v4
  session_id: string;            // session_YYYYMMDD_HHMMSS
  thread_id?: string;            // UUID v4 (optional)

  // Content
  prompt: string;                // User input
  response: string;              // LLM response

  // Metadata
  model: string;                 // e.g. "claude-3-5-sonnet-20241022"
  timestamp: string;             // ISO 8601 with timezone
  tokens?: number;               // Token count (optional)
  duration_ms?: number;          // Response time in milliseconds

  // User context
  user_id?: string;              // User identifier
  owner_hash?: string;           // SHA256 hash prefix
}

export interface InteractionMetadata {
  interaction_id: string;
  session_id: string;
  thread_id?: string;
  model: string;
  timestamp: string;
  tokens?: number;
  duration_ms?: number;
  user_id?: string;
  owner_hash?: string;
}

export interface InteractionViewerProps {
  interaction: Interaction;
  showMetadata?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onCopy?: (content: string) => void;
  onExport?: (interaction: Interaction) => void;
  className?: string;
}

export interface MetadataPanelProps {
  metadata: InteractionMetadata;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}
