/**
 * Extracts a user-facing error message from an API error response.
 * Handles both { error: "..." } (RAG/premium endpoints) and
 * { message: "..." } (standard endpoints) response shapes.
 */
export function extractApiError(errorData: unknown, fallback: string): string {
  if (!errorData || typeof errorData !== 'object') return fallback;

  const data = errorData as Record<string, unknown>;

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  return fallback;
}

/**
 * Returns true when an HTTP response status is 403 with a premium error message.
 * Used to distinguish premium-gating from other errors.
 */
export function isPremiumError(status: number, errorData: unknown): boolean {
  if (status !== 403) return false;
  const msg = extractApiError(errorData, '').toLowerCase();
  return msg.includes('premium') || msg.includes('subscription');
}
