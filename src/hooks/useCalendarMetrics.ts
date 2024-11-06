import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { CalendarMetrics } from '@/lib/calendar';

export function useCalendarMetrics() {
  const { data: session } = useSession();
  const [data, setData] = useState<CalendarMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/calendar/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch calendar metrics');
      }
      const metrics = await response.json();
      setData(metrics);
      setIsOffline(false); // Successfully fetched data, set offline state to false
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true); // If offline, set offline state
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchMetrics();

    const handleOnline = () => {
      setIsOffline(false);
      fetchMetrics(); // Retry fetching data when back online
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchMetrics]);

  const retry = () => {
    setError(null); // Reset error before retrying
    fetchMetrics();
  };

  return { data, isLoading, error, isOffline, retry };
}
