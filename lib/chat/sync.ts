/**
 * Chat Sync Utilities
 *
 * Handles merging and deduplication of messages from localStorage and backend.
 * Ensures cross-device consistency while maintaining instant UX.
 */

import type { FIMessage } from '@/types/assistant';

/**
 * Merge messages from localStorage and backend, removing duplicates.
 *
 * Strategy:
 * 1. Use timestamp + role + content as unique key
 * 2. Backend is source of truth (prefer backend in conflicts)
 * 3. Sort chronologically (oldest first)
 *
 * @param localMessages Messages from localStorage (instant cache)
 * @param backendMessages Messages from backend (source of truth)
 * @returns Merged and deduplicated messages
 */
export function mergeMessages(
  localMessages: FIMessage[],
  backendMessages: FIMessage[]
): FIMessage[] {
  // Create map for deduplication (key = timestamp + role + first 50 chars of content)
  const messageMap = new Map<string, FIMessage>();

  // Helper to create unique key
  const createKey = (msg: FIMessage): string => {
    const contentPreview = msg.content.substring(0, 50);
    return `${msg.timestamp}_${msg.role}_${contentPreview}`;
  };

  // Add backend messages first (source of truth)
  backendMessages.forEach(msg => {
    const key = createKey(msg);
    messageMap.set(key, msg);
  });

  // Add local messages (only if not already in backend)
  localMessages.forEach(msg => {
    const key = createKey(msg);
    if (!messageMap.has(key)) {
      messageMap.set(key, msg);
    }
  });

  // Convert to array and sort chronologically
  const merged = Array.from(messageMap.values());
  merged.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  return merged;
}

/**
 * Check if two message arrays are equivalent (for avoiding unnecessary updates)
 */
export function areMessagesEqual(a: FIMessage[], b: FIMessage[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((msg, idx) => {
    const other = b[idx];
    return (
      msg.timestamp === other.timestamp &&
      msg.role === other.role &&
      msg.content === other.content
    );
  });
}
