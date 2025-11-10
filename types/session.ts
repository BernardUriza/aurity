/**
 * Free Intelligence - Session Types
 *
 * TypeScript types for Sessions (1:1 with API schema).
 *
 * File: apps/aurity/ui/types/session.ts
 * Card: FI-UI-FEAT-201
 * Created: 2025-10-29
 */

export type SessionStatus = "new" | "active" | "complete";

export interface Session {
  id: string; // ULID
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  last_active: string; // ISO 8601
  interaction_count: number;
  status: SessionStatus;
  is_persisted: boolean;
  owner_hash: string;
  thread_id: string | null;
}

export interface SessionsListResponse {
  items: Session[];
  total: number;
  limit: number;
  offset: number;
}
