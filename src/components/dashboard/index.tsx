'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalendarMetrics {
  // Add your metrics types here based on what getCalendarMetrics returns
  scheduledMeetings?: number;
  totalDuration?: number;
  // ... other metrics
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CalendarMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const calendarResponse = await fetch('/api/calendar/metrics', {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!calendarResponse.ok) {
          throw new Error(`API error: ${calendarResponse.statusText}`);
        }

        const calendarData = await calendarResponse.json();
        setData(calendarData);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'An error occurred while loading the dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchData();
    }
  }, [session]);

  if (!session) {
    return (
      <Alert>
        <AlertDescription>Please sign in to view your dashboard.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your productivity insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.scheduledMeetings || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Meeting Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.totalDuration || 0}h</p>
          </CardContent>
        </Card>

        {/* Add more metric cards as needed */}
      </div>

      {/* You can add more dashboard sections here */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add timeline or chart components here */}
            <p className="text-gray-600">Coming soon: Detailed activity timeline</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}