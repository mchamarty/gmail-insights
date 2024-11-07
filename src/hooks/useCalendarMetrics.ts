import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRetry } from './useRetry';
import type { CalendarMetrics } from '@/lib/calendar';

export function useCalendarMetrics() {
  const { data: session } = useSession();
  const [isOffline, setIsOffline] = useState(false);

  const fetchCalendarMetrics = useCallback(async () => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/calendar/metrics', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status} - ${response.statusText}`);
    }

    const metrics = await response.json();
    return metrics as CalendarMetrics;
  }, [session]);

  const { 
    data, 
    isLoading, 
    error, 
    retry 
  } = useRetry<CalendarMetrics>(fetchCalendarMetrics, [session]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      retry();
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
  }, [retry]);

  return { 
    data, 
    isLoading, 
    error, 
    isOffline, 
    retry 
  };
}