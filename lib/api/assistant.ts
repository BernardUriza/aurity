/**
 * Free-Intelligence Assistant API Client
 *
 * Card: FI-ONBOARD-001
 * HTTP client for communicating with backend /api/assistant endpoints
 */

import type {
  FIChatRequest,
  FIChatResponse,
  FIErrorResponse,
  FIIntroductionContext,
} from '@/types/assistant';

/**
 * Assistant API configuration
 */
interface AssistantAPIConfig {
  baseURL: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<AssistantAPIConfig> = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001',
  timeout: 30000, // 30 seconds (backend can take 10-15s for LLM calls)
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Retry-able HTTP fetch with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: Required<AssistantAPIConfig>
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry on 4xx client errors (except 429 rate limit)
      if (!response.ok && response.status >= 400 && response.status < 500 && response.status !== 429) {
        const error: FIErrorResponse = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Retry on 5xx server errors or 429 rate limit
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, ...
      const delay = config.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error during fetch');
}

/**
 * Assistant API Client
 */
export class AssistantAPI {
  private config: Required<AssistantAPIConfig>;

  constructor(config?: Partial<AssistantAPIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get FI introduction message
   *
   * Endpoint: POST /api/workflows/aurity/assistant/introduction
   *
   * @param context Optional context (physician_name, clinic_name)
   * @returns FI introduction response
   * @throws Error if request fails
   *
   * @example
   * ```ts
   * const api = new AssistantAPI();
   * const intro = await api.introduction({ physician_name: 'García', clinic_name: 'Test Clinic' });
   * console.log(intro.message); // FI's introduction
   * console.log(intro.persona); // 'onboarding_guide'
   * ```
   */
  async introduction(context?: FIIntroductionContext): Promise<FIChatResponse> {
    const url = `${this.config.baseURL}/api/workflows/aurity/assistant/introduction`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context || {}),
      },
      this.config
    );

    const data: FIChatResponse = await response.json();
    return data;
  }

  /**
   * Send chat message to FI
   *
   * Endpoint: POST /api/workflows/aurity/assistant/chat
   *
   * @param request Chat request with message, context, and session_id
   * @returns FI response
   * @throws Error if request fails
   *
   * @example
   * ```ts
   * const api = new AssistantAPI();
   * const response = await api.chat({
   *   message: '¿Qué es el error budget?',
   *   context: { phase: 'glitch', userRole: 'medico_general' },
   *   session_id: 'session_20251118_120000',
   * });
   * console.log(response.message);
   * console.log(response.persona); // 'general_assistant'
   * ```
   */
  async chat(request: FIChatRequest): Promise<FIChatResponse> {
    const url = `${this.config.baseURL}/api/workflows/aurity/assistant/chat`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      this.config
    );

    const data: FIChatResponse = await response.json();
    return data;
  }

  /**
   * Public chat (anonymous, rate-limited)
   *
   * @deprecated Use `chat()` instead. This method is deprecated and will be removed
   * in a future version. The `chat()` method handles both authenticated (with memory)
   * and anonymous (ephemeral) conversations automatically.
   *
   * Endpoint: POST /api/workflows/aurity/assistant/public-chat
   *
   * This endpoint doesn't require Auth0 and has rate-limiting:
   * - 20 req/min per IP
   * - 10 req/min per session
   *
   * @param request Chat request with message, context, and session_id
   * @returns FI response with remaining_requests
   * @throws Error if request fails (including 429 rate-limit, 503 kill-switch)
   *
   * @example
   * ```ts
   * // ❌ DEPRECATED - Don't use publicChat()
   * const response = await api.publicChat({ message: '...' });
   *
   * // ✅ USE THIS INSTEAD - Use chat() without doctor_id
   * const response = await api.chat({
   *   message: '¿Qué es AURITY?',
   *   context: {}, // No doctor_id = ephemeral mode
   *   session_id: 'public_session_123',
   * });
   * ```
   */
  async publicChat(request: FIChatRequest): Promise<FIChatResponse & { remaining_requests: number }> {
    const url = `${this.config.baseURL}/api/workflows/aurity/assistant/public-chat`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      this.config
    );

    const data = await response.json();
    return data;
  }

  /**
   * Health check for Assistant API
   *
   * @returns true if API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use workflows health endpoint instead
      const url = `${this.config.baseURL}/api/workflows/aurity/assistant/health`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AssistantAPIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<AssistantAPIConfig>> {
    return { ...this.config };
  }
}

/**
 * Singleton instance for convenience
 */
export const assistantAPI = new AssistantAPI();

/**
 * Export types for convenience
 */
export type {
  FIChatRequest,
  FIChatResponse,
  FIErrorResponse,
  FIIntroductionContext,
} from '@/types/assistant';
