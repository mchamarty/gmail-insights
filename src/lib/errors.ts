export type ErrorCode = 
  | 'AUTH_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: ErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleGoogleAPIError(error: any): APIError {
  // Network errors
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return new APIError(
      'No internet connection. Please check your network.',
      0,
      'NETWORK_ERROR',
      true
    );
  }

  if (error?.code === 401 || error?.message?.includes('invalid_grant')) {
    return new APIError(
      'Your session has expired. Please sign in again.',
      401,
      'AUTH_EXPIRED',
      false
    );
  }

  if (error?.code === 403) {
    return new APIError(
      'Insufficient permissions. Please check your Google account settings.',
      403,
      'INSUFFICIENT_PERMISSIONS',
      false
    );
  }

  if (error?.code === 429) {
    return new APIError(
      'Rate limit exceeded. Please try again in a few minutes.',
      429,
      'RATE_LIMIT',
      true
    );
  }

  if (error?.code >= 500) {
    return new APIError(
      'Google services are temporarily unavailable. Please try again later.',
      error.code,
      'API_ERROR',
      true
    );
  }

  return new APIError(
    'An unexpected error occurred.',
    500,
    'UNKNOWN',
    true
  );
}

export function getRetryDelay(attempt: number, error: APIError): number {
  if (!error.retryable) return 0;
  
  // Exponential backoff with jitter
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
  const jitter = Math.random() * 1000;
  
  // For rate limiting, use a longer delay
  if (error.code === 'RATE_LIMIT') {
    return baseDelay * 2 + jitter;
  }
  
  return baseDelay + jitter;
}

export function shouldRetry(error: APIError, attempt: number): boolean {
  if (!error.retryable) return false;
  if (attempt >= 3) return false;
  
  return true;
}