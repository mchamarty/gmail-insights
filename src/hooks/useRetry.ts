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
  const [isLoading, setIsLoading] = useState(false);  // Changed to false initially
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const execute = useCallback(async () => {
    console.log('Execute called, auth status:', status);
    if (status !== 'authenticated') {
      console.log('Not authenticated, stopping execution');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting execution attempt:', attempt);
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      console.log('Fetch successful:', !!result);
      setData(result);
      setAttempt(0);
    } catch (err) {
      console.error('Execution error:', err);
      const apiError = err instanceof APIError ? err : new APIError(
        'An unexpected error occurred',
        500,
        'UNKNOWN',
        true
      );

      if (shouldRetry(apiError, attempt)) {
        console.log('Retrying after error, attempt:', attempt + 1);
        const delay = getRetryDelay(attempt, apiError);
        setAttempt(prev => prev + 1);
        
        setTimeout(() => {
          execute();
        }, delay);
      } else {
        console.log('Max retries reached or non-retryable error');
        setError(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, attempt, status]);

  // Reset on dependency changes
  const retry = useCallback(() => {
    console.log('Retry called');
    setAttempt(0);
    return execute();
  }, [execute]);

  return { data, isLoading, error, retry };
}