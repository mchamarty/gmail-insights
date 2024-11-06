import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  timestamp?: number;
}

export function OfflineIndicator({ timestamp }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>
            Offline
            {timestamp ? (
              <span className="ml-1 text-xs">
                (Last updated: {new Date(timestamp).toLocaleTimeString()})
              </span>
            ) : (
              <span className="ml-1 text-xs">(No recent data)</span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
