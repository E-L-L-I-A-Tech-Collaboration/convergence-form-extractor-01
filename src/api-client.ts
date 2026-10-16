/**
 * Safe API Client for Convergence Form Extractor.
 * Validates JSON content types and gracefully handles unexpected responses,
 * preventing JSON parse errors from HTML payloads.
 */

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackData?: T
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';

    // If response is not JSON (e.g., HTML during restart or proxy error)
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        data: fallbackData ?? null,
        error: `Received non-JSON content-type (${contentType || 'none'}) with status ${res.status}`
      };
    }

    const json = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: fallbackData ?? null,
        error: json?.error || `HTTP error ${res.status}`
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json as T
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: fallbackData ?? null,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
