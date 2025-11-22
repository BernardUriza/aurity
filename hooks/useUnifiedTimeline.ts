/**
 * useUnifiedTimeline Hook
 *
 * Custom hook for managing unified timeline state with:
 * - Pagination (infinite scroll)
 * - Time range filtering
 * - Event type filtering
 * - Automatic data windowing
 *
 * Card: FI-PHIL-DOC-014 (Memoria Longitudinal Unificada)
 * Created: 2025-11-22
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  getUnifiedTimeline,
  getTimelineStats,
  type UnifiedEvent,
  type UnifiedTimelineResponse,
  type TimelineStatsResponse,
} from '@/lib/api/unified-timeline';
import {
  TIMELINE_PAGINATION,
  TIMELINE_TIME_RANGES,
  EVENT_TYPES,
  getTimeRangeFromPreset,
  type EventTypeFilter,
  type TimelinePreset,
} from '@/config/timeline.config';

// ============================================================================
// Types
// ============================================================================

export interface TimelineState {
  events: UnifiedEvent[];
  total: number;
  hasMore: boolean;
  chatCount: number;
  audioCount: number;
}

export interface TimelineFilters {
  eventType: EventTypeFilter;
  timeRange: {
    start: string | null;
    end: string | null;
  };
  preset: TimelinePreset | null;
}

export interface UseUnifiedTimelineReturn {
  // State
  events: UnifiedEvent[];
  stats: TimelineStatsResponse | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;

  // Counts
  chatCount: number;
  audioCount: number;

  // Filters
  filters: TimelineFilters;
  setEventType: (type: EventTypeFilter) => void;
  setTimeRangePreset: (preset: TimelinePreset) => void;
  setCustomTimeRange: (start: string | null, end: string | null) => void;

  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Auth state
  isAuthenticated: boolean;
  doctorId: string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUnifiedTimeline(): UseUnifiedTimelineReturn {
  // Auth
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const doctorId = user?.sub ?? null;

  // State
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [stats, setStats] = useState<TimelineStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [audioCount, setAudioCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<TimelineFilters>({
    eventType: EVENT_TYPES.ALL,
    timeRange: { start: null, end: null },
    preset: TIMELINE_TIME_RANGES.PRESETS.find(p => p.hours === null) ?? null,
  });

  // Refs for pagination
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchTimeline = useCallback(
    async (reset: boolean = true) => {
      if (!doctorId || isFetchingRef.current) return;

      isFetchingRef.current = true;
      const newOffset = reset ? 0 : offsetRef.current;

      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await getUnifiedTimeline({
          doctorId,
          offset: newOffset,
          limit: TIMELINE_PAGINATION.DEFAULT_LIMIT,
          eventType: filters.eventType,
          startTime: filters.timeRange.start,
          endTime: filters.timeRange.end,
        });

        if (reset) {
          setEvents(response.events);
          offsetRef.current = response.events.length;
        } else {
          setEvents(prev => [...prev, ...response.events]);
          offsetRef.current += response.events.length;
        }

        setTotal(response.total);
        setHasMore(response.has_more);
        setChatCount(response.chat_count);
        setAudioCount(response.audio_count);
      } catch (err) {
        console.error('[useUnifiedTimeline] Fetch error:', err);
        setError('Error al cargar la memoria longitudinal');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [doctorId, filters]
  );

  const fetchStats = useCallback(async () => {
    if (!doctorId) return;

    try {
      const statsData = await getTimelineStats(doctorId);
      setStats(statsData);
    } catch {
      // Stats are optional, don't show error
    }
  }, [doctorId]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated && doctorId && !authLoading) {
      fetchTimeline(true);
      fetchStats();
    }
  }, [isAuthenticated, doctorId, authLoading, fetchTimeline, fetchStats]);

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated && doctorId) {
      fetchTimeline(true);
    }
  }, [filters, isAuthenticated, doctorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // Actions
  // ============================================================================

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isFetchingRef.current) return;
    await fetchTimeline(false);
  }, [hasMore, isLoadingMore, fetchTimeline]);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    await fetchTimeline(true);
    await fetchStats();
  }, [fetchTimeline, fetchStats]);

  const setEventType = useCallback((type: EventTypeFilter) => {
    setFilters(prev => ({ ...prev, eventType: type }));
  }, []);

  const setTimeRangePreset = useCallback((preset: TimelinePreset) => {
    const range = getTimeRangeFromPreset(preset);
    setFilters(prev => ({
      ...prev,
      preset,
      timeRange: range,
    }));
  }, []);

  const setCustomTimeRange = useCallback((start: string | null, end: string | null) => {
    setFilters(prev => ({
      ...prev,
      preset: null,
      timeRange: { start, end },
    }));
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    events,
    stats,
    isLoading: isLoading || authLoading,
    isLoadingMore,
    error,
    hasMore,
    total,

    // Counts
    chatCount,
    audioCount,

    // Filters
    filters,
    setEventType,
    setTimeRangePreset,
    setCustomTimeRange,

    // Actions
    loadMore,
    refresh,

    // Auth
    isAuthenticated,
    doctorId,
  };
}
