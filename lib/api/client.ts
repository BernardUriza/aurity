/**
 * Base API Client
 *
 * Centralized fetch wrapper with error handling and type safety.
 *
 * File: apps/aurity/lib/api/client.ts
 * Created: 2025-11-08
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number; // Number of retry attempts (default: 0 for regular requests, 3 for uploads)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
}

async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(
        response.status,
        response.statusText,
        errorText || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload multipart form data (files, audio chunks, etc.) with retry logic
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Upload Retry] Attempt ${attempt}/${retries} after ${delay}ms delay`);
        await sleep(delay);
      }

      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        method: 'POST',
        body: formData,
        // Don't set Content-Type - browser sets it with boundary
        headers: {
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          response.status,
          response.statusText,
          errorText || `Upload failed: ${response.statusText}`
        );
      }

      // Success - return result
      if (attempt > 0) {
        console.log(`[Upload Retry] Success on attempt ${attempt + 1}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on HTTP errors (4xx, 5xx) - only retry network errors
      if (error instanceof APIError) {
        console.error(`[Upload] HTTP ${error.status} - not retrying`);
        throw error;
      }

      // Log retry attempt
      if (attempt < retries) {
        console.warn(
          `[Upload] Attempt ${attempt + 1}/${retries + 1} failed: ${lastError.message}`
        );
      } else {
        console.error(
          `[Upload] All ${retries + 1} attempts failed: ${lastError.message}`
        );
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `Upload failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    apiUpload<T>(endpoint, formData, options),
};
