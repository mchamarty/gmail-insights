'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Clock,
  Shield,
  TrendingUp,
  Calendar,
  Mail,
  LogIn
} from 'lucide-react';

import { useGmailMetrics } from '@/hooks/useGmailMetrics';
import { useCalendarMetrics } from '@/hooks/useCalendarMetrics';
import CurrentWorkloadTab from '@/components/dashboard/CurrentWorkloadTab';
import TimeConsumptionTab from '@/components/dashboard/TimeConsumptionTab';
import TimeProtectionTab from '@/components/dashboard/TimeProtectionTab';
import WorkloadImpactTab from '@/components/dashboard/WorkloadImpactTab';

interface DashboardData {
  timeframe: string;
  currentWorkload: {
    urgentItems: any[];
    upcomingMeetings: any[];
    emailMetrics: {
      unreadCount: number;
      needingResponse: number;
      activeThreads: number;
    };
  };
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    timeframe: 'Today',
    currentWorkload: {
      urgentItems: [],
      upcomingMeetings: [],
      emailMetrics: {
        unreadCount: 12,
        needingResponse: 5,
        activeThreads: 8
      }
    }
  };
};

// Helper function to calculate productivity score
function calculateProductivityScore(emailData: any) {
  if (!emailData) return 0;

  const unreadPenalty = Math.min(emailData.totalUnread * 2, 30); // Max 30 point penalty
  const responseNeedPenalty = Math.min(emailData.needingResponse * 3, 30); // Max 30 point penalty

  const baseScore = 100;
  const finalScore = baseScore - unreadPenalty - responseNeedPenalty;

  return Math.max(0, Math.min(100, Math.round(finalScore)));
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { data: emailData, isLoading: emailLoading } = useGmailMetrics();
  const { data: calendarData, isLoading: calendarLoading } = useCalendarMetrics();
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('current');
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      if (status === 'authenticated') {
        setIsLoading(true);
        try {
          const dashboardData = await fetchDashboardData();
          setData(dashboardData);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [status]);

  const tabStyle = (isActive: boolean) => `
    relative px-6 py-3 rounded-md text-sm font-medium transition-all
    ${isActive 
      ? 'bg-primary text-primary-foreground shadow-sm' 
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }
    before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px]
    ${isActive ? 'before:bg-primary' : 'before:bg-transparent'}
  `;

  const timeframeMap = {
    current: 'Today',
    time: 'This Week',
    protection: 'This Week',
    impact: 'This Month'
  } as const;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold mb-4">Gmail Productivity Dashboard</h1>
        <p className="text-muted-foreground mb-8">Sign in with your Google account to get started</p>
        <button
          onClick={() => signIn('google')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Productivity Dashboard</h1>
            <p className="text-muted-foreground">
              Analyze your work patterns and optimize your productivity
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="space-y-8">
          {/* Quick Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Total Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {calendarLoading ? '...' : calendarData?.meetingStats.totalToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {calendarData?.meetingStats.backToBackCount 
                    ? `${calendarData.meetingStats.backToBackCount} back-to-back`
                    : 'No back-to-back meetings'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Load</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {emailLoading ? '...' : emailData?.totalUnread || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailData?.needingResponse 
                    ? `${emailData.needingResponse} need response`
                    : 'Unread messages'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Focus Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{isLoading ? '...' : '3.5h'}</div>
                <p className="text-xs text-muted-foreground">
                  Available today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Productivity Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {emailLoading ? '...' : calculateProductivityScore(emailData)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on email response time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="space-y-6 bg-card rounded-lg p-4">
            <div className="flex space-x-1 border-b">
              <button
                className={tabStyle(activeTab === 'current')}
                onClick={() => setActiveTab('current')}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Current Workload</span>
                </span>
              </button>
              <button
                className={tabStyle(activeTab === 'time')}
                onClick={() => setActiveTab('time')}
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Time Consumption</span>
                </span>
              </button>
              <button
                className={tabStyle(activeTab === 'protection')}
                onClick={() => setActiveTab('protection')}
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Time Protection</span>
                </span>
              </button>
              <button
                className={tabStyle(activeTab === 'impact')}
                onClick={() => setActiveTab('impact')}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Workload Impact</span>
                </span>
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'current' && (
                <CurrentWorkloadTab timeframe={data?.timeframe || timeframeMap.current} />
              )}
              {activeTab === 'time' && (
                <TimeConsumptionTab timeframe={timeframeMap.time} />
              )}
              {activeTab === 'protection' && (
                <TimeProtectionTab timeframe={timeframeMap.protection} />
              )}
              {activeTab === 'impact' && (
                <WorkloadImpactTab timeframe={timeframeMap.impact} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
