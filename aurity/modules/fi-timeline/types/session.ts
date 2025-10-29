/**
 * FI-Timeline Module - Session Types
 *
 * Type definitions for session metadata and timeline data
 * Maps to backend corpus_ops schema + policy system
 */

/**
 * Session metadata from corpus
 */
export interface SessionMetadata {
  session_id: string; // session_YYYYMMDD_HHMMSS
  thread_id?: string; // UUID v4 (optional)
  user_id?: string; // User identifier
  owner_hash?: string; // SHA256 prefix (16 chars)
  created_at: string; // ISO 8601
  last_active: string; // ISO 8601
  interaction_count: number;
  total_tokens?: number;
  is_persisted: boolean;
}

/**
 * Session timespan (derived from interactions)
 */
export interface SessionTimespan {
  start: string; // ISO 8601 of first interaction
  end: string; // ISO 8601 of last interaction
  duration_ms: number; // Total duration
  duration_human: string; // e.g., "2h 34m"
}

/**
 * Session size metrics
 */
export interface SessionSize {
  interaction_count: number;
  total_tokens: number;
  total_prompts_chars: number;
  total_responses_chars: number;
  avg_tokens_per_interaction: number;
  size_human: string; // e.g., "1.2MB"
}

/**
 * Policy badge status
 */
export type PolicyBadgeStatus = 'OK' | 'FAIL' | 'PENDING' | 'N/A';

/**
 * Policy badges for session
 */
export interface PolicyBadges {
  hash_verified: PolicyBadgeStatus; // Hash integrity check
  policy_compliant: PolicyBadgeStatus; // Policy compliance (append-only, no-mutation)
  redaction_applied: PolicyBadgeStatus; // Redaction applied (PII removal)
  audit_logged: PolicyBadgeStatus; // Audit trail present
}

/**
 * Complete session header data
 */
export interface SessionHeaderData {
  metadata: SessionMetadata;
  timespan: SessionTimespan;
  size: SessionSize;
  policy_badges: PolicyBadges;
}

/**
 * SessionHeader component props
 */
export interface SessionHeaderProps {
  session: SessionHeaderData;
  sticky?: boolean; // Sticky header on scroll
  onRefresh?: () => void; // Refresh session data
  onExport?: () => void; // Export session
}
