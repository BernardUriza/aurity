/**
 * Unified Timeline API Client
 *
 * Client for the unified timeline endpoint that combines
 * chat messages and audio transcriptions.
 *
 * Card: FI-PHIL-DOC-014 (Memoria Longitudinal Unificada)
 * Created: 2025-11-22
 */

import {
  TIMELINE_API,
  TIMELINE_PAGINATION,
  type EventTypeFilter,
} from '@/config/timeline.config';

// ============================================================================
// Types (matching backend schemas)
// ============================================================================

export interface UnifiedEvent {
  id: string;
  timestamp: number; // Unix timestamp (seconds)
  event_type: 'chat_user' | 'chat_assistant' | 'transcription';
  content: string;
  source: 'chat' | 'audio';

  // Optional metadata
  session_id?: string | null;
  persona?: string | null;
  chunk_number?: number | null;
  duration?: number | null;
  confidence?: number | null;
  language?: string | null;
  stt_provider?: string | null;
}

export interface UnifiedTimelineResponse {
  events: UnifiedEvent[];
  total: number;
  has_more: boolean;
  offset: number;
  limit: number;
  chat_count: number;
  audio_count: number;
  time_range: {
    start: string | null;
    end: string | null;
    start_ts: number | null;
    end_ts: number | null;
  };
}

export interface TimelineStatsResponse {
  total_events: number;
  chat_messages: number;
  audio_transcriptions: number;
  oldest_timestamp: number | null;
  newest_timestamp: number | null;
  unique_sessions: number;
}

export interface TimelineQueryParams {
  doctorId: string;
  offset?: number;
  limit?: number;
  eventType?: EventTypeFilter;
  startTime?: string | null;
  endTime?: string | null;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMELINE_API.TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Get unified timeline with pagination and filters
 *
 * @param params - Query parameters
 * @returns UnifiedTimelineResponse
 */
export async function getUnifiedTimeline(
  params: TimelineQueryParams
): Promise<UnifiedTimelineResponse> {
  const {
    doctorId,
    offset = 0,
    limit = TIMELINE_PAGINATION.DEFAULT_LIMIT,
    eventType = 'all',
    startTime,
    endTime,
  } = params;

  const url = new URL(`${TIMELINE_API.BASE_URL}${TIMELINE_API.ENDPOINT}`);
  url.searchParams.set('doctor_id', doctorId);
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('limit', Math.min(limit, TIMELINE_PAGINATION.MAX_LIMIT).toString());
  url.searchParams.set('event_type', eventType);

  if (startTime) {
    url.searchParams.set('start_time', startTime);
  }
  if (endTime) {
    url.searchParams.set('end_time', endTime);
  }

  try {
    console.log('[UnifiedTimeline] Fetching:', url.toString());
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      console.error('[UnifiedTimeline] Error:', response.status, response.statusText);
      // Return empty response on error (graceful degradation)
      return createEmptyResponse(offset, limit);
    }

    const data: UnifiedTimelineResponse = await response.json();
    console.log('[UnifiedTimeline] Received:', data.events.length, 'events');
    return data;

  } catch (error) {
    console.error('[UnifiedTimeline] Fetch failed:', error);
    return createEmptyResponse(offset, limit);
  }
}

/**
 * Get timeline statistics
 */
export async function getTimelineStats(
  doctorId: string
): Promise<TimelineStatsResponse> {
  const url = new URL(`${TIMELINE_API.BASE_URL}${TIMELINE_API.STATS_ENDPOINT}`);
  url.searchParams.set('doctor_id', doctorId);

  try {
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      return createEmptyStats();
    }

    return response.json();
  } catch {
    return createEmptyStats();
  }
}

/**
 * Load more events (for infinite scroll)
 */
export async function loadMoreEvents(
  params: TimelineQueryParams,
  currentOffset: number
): Promise<UnifiedTimelineResponse> {
  return getUnifiedTimeline({
    ...params,
    offset: currentOffset,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function createEmptyResponse(offset: number, limit: number): UnifiedTimelineResponse {
  return {
    events: [],
    total: 0,
    has_more: false,
    offset,
    limit,
    chat_count: 0,
    audio_count: 0,
    time_range: {
      start: null,
      end: null,
      start_ts: null,
      end_ts: null,
    },
  };
}

function createEmptyStats(): TimelineStatsResponse {
  return {
    total_events: 0,
    chat_messages: 0,
    audio_transcriptions: 0,
    oldest_timestamp: null,
    newest_timestamp: null,
    unique_sessions: 0,
  };
}

// ============================================================================
// React Query Keys (for cache management)
// ============================================================================

export const timelineQueryKeys = {
  all: ['unified-timeline'] as const,
  list: (params: TimelineQueryParams) =>
    [...timelineQueryKeys.all, 'list', params] as const,
  stats: (doctorId: string) =>
    [...timelineQueryKeys.all, 'stats', doctorId] as const,
};
