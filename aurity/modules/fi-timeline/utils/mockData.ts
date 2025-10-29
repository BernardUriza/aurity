/**
 * FI-Timeline Mock Data Generator
 *
 * Generates realistic session data for development and testing
 */

import type { SessionHeaderData, SessionMetadata, SessionTimespan, SessionSize, PolicyBadges } from '../types/session';

/**
 * Calculate duration in human-readable format
 */
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Generate mock session metadata
 */
export function generateMockMetadata(): SessionMetadata {
  const now = new Date();
  const sessionId = `session_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    session_id: sessionId,
    thread_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    user_id: 'bernard.uriza@example.com',
    owner_hash: '9f87ac3a4326090e',
    created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    last_active: now.toISOString(),
    interaction_count: 15,
    total_tokens: 12500,
    is_persisted: true,
  };
}

/**
 * Generate mock session timespan
 */
export function generateMockTimespan(): SessionTimespan {
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const end = now;
  const duration_ms = end.getTime() - start.getTime();

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    duration_ms,
    duration_human: formatDuration(duration_ms),
  };
}

/**
 * Generate mock session size metrics
 */
export function generateMockSize(): SessionSize {
  const interaction_count = 15;
  const total_tokens = 12500;
  const total_prompts_chars = 8500;
  const total_responses_chars = 45000;
  const total_bytes = total_prompts_chars + total_responses_chars;

  return {
    interaction_count,
    total_tokens,
    total_prompts_chars,
    total_responses_chars,
    avg_tokens_per_interaction: total_tokens / interaction_count,
    size_human: formatBytes(total_bytes),
  };
}

/**
 * Generate mock policy badges
 */
export function generateMockPolicyBadges(): PolicyBadges {
  return {
    hash_verified: 'OK',
    policy_compliant: 'OK',
    redaction_applied: 'N/A',
    audit_logged: 'OK',
  };
}

/**
 * Generate complete mock session header data
 */
export function generateMockSessionHeader(): SessionHeaderData {
  return {
    metadata: generateMockMetadata(),
    timespan: generateMockTimespan(),
    size: generateMockSize(),
    policy_badges: generateMockPolicyBadges(),
  };
}

/**
 * Generate mock session header with custom status
 */
export function generateMockSessionHeaderWithStatus(
  hashStatus: 'OK' | 'FAIL' | 'PENDING' | 'N/A' = 'OK',
  policyStatus: 'OK' | 'FAIL' | 'PENDING' | 'N/A' = 'OK',
  redactionStatus: 'OK' | 'FAIL' | 'PENDING' | 'N/A' = 'N/A',
  auditStatus: 'OK' | 'FAIL' | 'PENDING' | 'N/A' = 'OK'
): SessionHeaderData {
  const base = generateMockSessionHeader();

  return {
    ...base,
    policy_badges: {
      hash_verified: hashStatus,
      policy_compliant: policyStatus,
      redaction_applied: redactionStatus,
      audit_logged: auditStatus,
    },
  };
}
