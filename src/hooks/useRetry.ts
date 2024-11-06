import { useState, useCallback } from 'react';
import { APIError, getRetryDelay, shouldRetry } from '@/lib/errors';
import { useSession } from 'next-auth/react';

interface RetryHookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => Promise<void>;
}

export function useRetry<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): RetryHookResult<T> {
  const { data: session, status } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const execute = useCallback(async () => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      setAttempt(0);
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError(
        'An unexpected error occurred',
        500,
        'UNKNOWN',
        true
      );

      if (shouldRetry(apiError, attempt)) {
        const delay = getRetryDelay(attempt, apiError);
        setAttempt(prev => prev + 1);
        
        setTimeout(() => {
          execute();
        }, delay);
      } else {
        setError(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, attempt, status]);

  // Reset on dependency changes
  const retry = useCallback(() => {
    setAttempt(0);
    return execute();
  }, [execute]);

  return { data, isLoading, error, retry };
}