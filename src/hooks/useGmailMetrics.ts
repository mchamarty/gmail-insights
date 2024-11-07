import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRetry } from './useRetry';
import type { EmailMetrics } from '@/lib/gmail';

export function useGmailMetrics() {
  const { data: session } = useSession();
  const [isOffline, setIsOffline] = useState(false);

  const fetchGmailMetrics = useCallback(async () => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/gmail/metrics', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} - ${response.statusText}`);
    }

    const metrics = await response.json();
    return metrics as EmailMetrics;
  }, [session]);

  const { 
    data, 
    isLoading, 
    error, 
    retry 
  } = useRetry<EmailMetrics>(fetchGmailMetrics, [session]);

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