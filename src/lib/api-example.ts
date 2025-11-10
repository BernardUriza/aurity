/**
 * Example usage of type-safe API client
 *
 * Generated from FastAPI OpenAPI specs
 * To regenerate: npm run generate:api
 */

import { client } from '@/api/public/client.gen';
import { client as internalClient } from '@/api/internal/client.gen';

// Configure base URLs
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api',
});

internalClient.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:7001/internal',
});

// ============================================================================
// PUBLIC API EXAMPLES
// ============================================================================

/**
 * Example 1: Start a consultation workflow
 */
export async function startConsultation(audioFile: File, sessionId: string) {
  const { listConsultJobsWorkflowsAurityConsultGet, startConsultWorkflowWorkflowsAurityConsultPost } = await import('@/api/public');

  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await startConsultWorkflowWorkflowsAurityConsultPost({
    headers: {
      'X-Session-ID': sessionId,
    },
    body: formData,
  });

  if (response.error) {
    throw new Error('Failed to start consultation');
  }

  return response.data;
}

/**
 * Example 2: Get consultation status
 */
export async function getConsultationStatus(jobId: string, retrySoap = false) {
  const { getConsultStatusWorkflowsAurityConsultJobIdGet } = await import('@/api/public');

  const response = await getConsultStatusWorkflowsAurityConsultJobIdGet({
    path: { job_id: jobId },
    query: { retry_soap: retrySoap },
  });

  if (response.error) {
    throw new Error('Failed to get consultation status');
  }

  return response.data;
}

/**
 * Example 3: Synthesize speech (Azure TTS)
 */
export async function synthesizeSpeech(text: string, voice = 'es-MX-DaliaNeural') {
  const { synthesizeSpeechTtsSynthesizePost } = await import('@/api/public');

  const response = await synthesizeSpeechTtsSynthesizePost({
    body: {
      text,
      voice,
      rate: '0%',
      pitch: '0%',
    },
  });

  if (response.error) {
    throw new Error('Failed to synthesize speech');
  }

  return response.data;
}

/**
 * Example 4: Get T21 resources
 */
export async function getT21Resources(category?: 'guide' | 'video' | 'article' | 'tool') {
  const { listResourcesApiT21ResourcesGet } = await import('@/api/public');

  const response = await listResourcesApiT21ResourcesGet({
    query: category ? { category } : undefined,
  });

  if (response.error) {
    throw new Error('Failed to get T21 resources');
  }

  return response.data;
}

// ============================================================================
// INTERNAL API EXAMPLES
// ============================================================================

/**
 * Example 5: Start athlete session (FI-STRIDE)
 */
export async function startAthleteSession(sessionDesignId: string, athleteId: string) {
  const { startSessionAthleteSessionsAthleteSessionsStartPost } = await import('@/api/internal');

  const response = await startSessionAthleteSessionsAthleteSessionsStartPost({
    body: {
      session_design_id: sessionDesignId,
      athlete_id: athleteId,
    },
  });

  if (response.error) {
    throw new Error('Failed to start athlete session');
  }

  return response.data;
}

/**
 * Example 6: Get audit logs
 */
export async function getAuditLogs(limit = 100, operation?: string) {
  const { getLogsAuditLogsGet } = await import('@/api/internal');

  const response = await getLogsAuditLogsGet({
    query: {
      limit,
      operation,
    },
  });

  if (response.error) {
    throw new Error('Failed to get audit logs');
  }

  return response.data;
}

/**
 * Example 7: Get system health
 */
export async function getSystemHealth() {
  const { getSystemHealthSystemHealthGet } = await import('@/api/public');

  const response = await getSystemHealthSystemHealthGet();

  if (response.error) {
    throw new Error('Failed to get system health');
  }

  return response.data;
}

// ============================================================================
// REACT HOOKS EXAMPLES (Optional - for Next.js/React usage)
// ============================================================================

/**
 * Example React Hook: useConsultationStatus
 */
export function useConsultationStatus(jobId: string | null) {
  // This would use React Query or SWR in a real app
  // Example:
  // import { useQuery } from '@tanstack/react-query';
  //
  // return useQuery({
  //   queryKey: ['consultation-status', jobId],
  //   queryFn: () => jobId ? getConsultationStatus(jobId) : null,
  //   enabled: !!jobId,
  //   refetchInterval: 2000, // Poll every 2 seconds
  // });
}

/**
 * Example React Hook: useT21Resources
 */
export function useT21Resources(category?: 'guide' | 'video' | 'article' | 'tool') {
  // Example with SWR:
  // import useSWR from 'swr';
  //
  // return useSWR(['t21-resources', category], () => getT21Resources(category));
}
