'use client';

/**
 * FI-VIEWER Module - useInteractions Hook
 *
 * React hook for fetching and managing interactions from backend
 * Integrates with Free Intelligence backend corpus_ops API
 */

import { useState, useEffect, useCallback } from 'react';
import type { Interaction } from '../types/interaction';

interface UseInteractionsOptions {
  sessionId?: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UseInteractionsResult {
  interactions: Interaction[];
  currentIndex: number;
  currentInteraction: Interaction | null;
  loading: boolean;
  error: Error | null;
  hasNext: boolean;
  hasPrev: boolean;
  navigateNext: () => void;
  navigatePrev: () => void;
  goToIndex: (index: number) => void;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and navigate interactions
 *
 * @example
 * ```tsx
 * const { currentInteraction, navigateNext, navigatePrev } = useInteractions({
 *   sessionId: 'session_20241028_123456',
 *   autoFetch: true
 * });
 * ```
 */
export function useInteractions(
  options: UseInteractionsOptions = {}
): UseInteractionsResult {
  const {
    sessionId,
    limit = 100,
    offset = 0,
    autoFetch = true,
  } = options;

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch interactions from backend
  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (sessionId) {
        params.append('session_id', sessionId);
      }

      // Call backend API (adjust URL based on your setup)
      const response = await fetch(`/api/interactions?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch interactions: ${response.statusText}`);
      }

      const data = await response.json();
      setInteractions(data.interactions || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, limit, offset]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchInteractions();
    }
  }, [autoFetch, fetchInteractions]);

  // Navigation functions
  const navigateNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, interactions.length - 1));
  }, [interactions.length]);

  const navigatePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < interactions.length) {
        setCurrentIndex(index);
      }
    },
    [interactions.length]
  );

  // Computed values
  const currentInteraction = interactions[currentIndex] || null;
  const hasNext = currentIndex < interactions.length - 1;
  const hasPrev = currentIndex > 0;

  return {
    interactions,
    currentIndex,
    currentInteraction,
    loading,
    error,
    hasNext,
    hasPrev,
    navigateNext: hasNext ? navigateNext : () => {},
    navigatePrev: hasPrev ? navigatePrev : () => {},
    goToIndex,
    refresh: fetchInteractions,
  };
}
