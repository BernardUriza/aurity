/**
 * Timeline API Client
 *
 * Client for Free Intelligence Timeline API (backend/timeline_api.py)
 * Port: 9002
 *
 * Card: FI-UI-FEAT-100
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TIMELINE_API_URL || 'http://localhost:9002';

export interface SessionMetadata {
  session_id: string;
  thread_id: string | null;
  owner_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SessionTimespan {
  start: string;
  end: string;
  duration_ms: number;
  duration_human: string;
}

export interface SessionSize {
  interaction_count: number;
  total_tokens: number;
  total_chars: number;
  avg_tokens_per_interaction: number;
  size_human: string;
}

export interface PolicyBadges {
  hash_verified: 'OK' | 'FAIL' | 'PENDING' | 'N/A';
  policy_compliant: 'OK' | 'FAIL' | 'PENDING' | 'N/A';
  redaction_applied: 'OK' | 'FAIL' | 'PENDING' | 'N/A';
  audit_logged: 'OK' | 'FAIL' | 'PENDING' | 'N/A';
}

export interface SessionSummary {
  metadata: SessionMetadata;
  timespan: SessionTimespan;
  size: SessionSize;
  policy_badges: PolicyBadges;
  preview: string;
}

export interface EventResponse {
  event_id: string;
  event_type: string;
  timestamp: string;
  who: string;
  what: string;
  summary: string | null;
  content_hash: string;
  redaction_policy: string;
  causality: any[];
  tags: string[];
  auto_generated: boolean;
  generation_mode: string;
  confidence_score: number;
}

export interface SessionDetail {
  metadata: SessionMetadata;
  timespan: SessionTimespan;
  size: SessionSize;
  policy_badges: PolicyBadges;
  events: EventResponse[];
  generation_mode: string;
  auto_events_count: number;
  manual_events_count: number;
  redaction_stats: Record<string, number>;
}

export interface TimelineStats {
  total_sessions: number;
  total_events: number;
  total_tokens: number;
  avg_events_per_session: number;
  event_types_breakdown: Record<string, number>;
  redaction_stats: Record<string, number>;
  generation_modes: Record<string, number>;
  date_range: Record<string, string>;
}

/**
 * Fetch session summaries with pagination
 */
export async function getSessionSummaries(params?: {
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'oldest' | 'events_desc' | 'events_asc';
}): Promise<SessionSummary[]> {
  const { limit = 50, offset = 0, sort = 'recent' } = params || {};

  const url = new URL(`${API_BASE_URL}/api/timeline/sessions`);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('sort', sort);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch session detail by ID
 */
export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail> {
  const url = `${API_BASE_URL}/api/timeline/sessions/${sessionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Session ${sessionId} not found`);
    }
    throw new Error(`Failed to fetch session: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch events with filters
 */
export async function getEvents(params?: {
  session_id?: string;
  event_type?: string;
  who?: string;
  limit?: number;
  offset?: number;
}): Promise<EventResponse[]> {
  const { session_id, event_type, who, limit = 100, offset = 0 } = params || {};

  const url = new URL(`${API_BASE_URL}/api/timeline/events`);

  if (session_id) url.searchParams.set('session_id', session_id);
  if (event_type) url.searchParams.set('event_type', event_type);
  if (who) url.searchParams.set('who', who);

  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch timeline statistics
 */
export async function getTimelineStats(): Promise<TimelineStats> {
  const url = `${API_BASE_URL}/api/timeline/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  storage_path: string;
  storage_exists: boolean;
  timestamp: string;
}> {
  const url = `${API_BASE_URL}/health`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}
