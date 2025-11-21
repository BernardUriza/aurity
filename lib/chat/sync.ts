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
  // Deduplicate messages: prefer messages with IDs, use content as fallback
  const deduped: FIMessage[] = [];

  // Helper to check if message already exists
  const isDuplicate = (msg: FIMessage, existing: FIMessage[]): boolean => {
    return existing.some(e => {
      // Check 1: ID match (if both have IDs)
      if (msg.metadata?.id && e.metadata?.id) {
        return msg.metadata.id === e.metadata.id;
      }

      // Check 2: Content match (works for messages with or without IDs)
      return e.role === msg.role && e.content.trim() === msg.content.trim();
    });
  };

  console.log('[Merge] Local:', localMessages.length, 'Backend:', backendMessages.length);

  // Add backend messages first (source of truth)
  backendMessages.forEach(msg => {
    if (!isDuplicate(msg, deduped)) {
      deduped.push(msg);
    }
  });

  // Add local messages (only if not in backend)
  localMessages.forEach(msg => {
    if (!isDuplicate(msg, deduped)) {
      deduped.push(msg);
    } else {
      console.log('[Merge] Skipping duplicate:',
        msg.metadata?.id || msg.content.substring(0, 50));
    }
  });

  // Sort chronologically
  deduped.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  console.log('[Merge] Result:', deduped.length, 'messages (removed',
    localMessages.length + backendMessages.length - deduped.length, 'duplicates)');
  return deduped;
}

/**
 * Check if two message arrays are equivalent (for avoiding unnecessary updates)
 * Uses content-based comparison (ignores timestamp drift)
 */
export function areMessagesEqual(a: FIMessage[], b: FIMessage[]): boolean {
  if (a.length !== b.length) {
    console.log('[AreEqual] Different lengths:', a.length, 'vs', b.length);
    return false;
  }

  const result = a.every((msg, idx) => {
    const other = b[idx];
    // Compare role + content only (timestamps can drift between client/server)
    return (
      msg.role === other.role &&
      msg.content.trim() === other.content.trim()
    );
  });

  console.log('[AreEqual] Result:', result);
  return result;
}
