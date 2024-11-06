'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, Calendar, Mail, HelpCircle, ChevronUp, ChevronDown,
  LucideIcon, Users, Video
} from 'lucide-react';
import { useGmailMetrics } from '@/hooks/useGmailMetrics';
import { useCalendarMetrics } from '@/hooks/useCalendarMetrics';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { ErrorMessage } from '@/components/ui/error-message';
import type { CalendarEvent } from '@/lib/calendar';

interface Metric {
  title: string;
  icon?: LucideIcon;
  calculation: string;
  importance: string;
  actions: string[];
}

interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

interface MetricCardProps extends BaseProps {
  title: string;
  metric: Metric;
  children?: React.ReactNode;
}

interface CurrentWorkloadTabProps {
  timeframe: string;
}

function formatMeetingTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

const CurrentWorkloadTab = ({ timeframe }: CurrentWorkloadTabProps) => {
  const { 
    data: emailData, 
    isLoading: emailLoading, 
    error: emailError, 
    isOffline, 
    retry 
  } = useGmailMetrics();
  
  const { 
    data: calendarData, 
    isLoading: calendarLoading, 
    error: calendarError 
  } = useCalendarMetrics();
  
  const [isExpanded, setIsExpanded] = React.useState(false);

  const urgentItems = React.useMemo(() => {
    if (!emailData?.recentEmails) return [];
    
    return emailData.recentEmails
      .filter(email => email.isUnread)
      .map(email => ({
        type: 'email' as const,
        title: email.subject,
        from: email.from,
        waited: formatTimeAgo(new Date(email.date)),
        priority: determinePriority(email),
      }));
  }, [emailData?.recentEmails]);

  function formatTimeAgo(date: Date) {
    const hours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1h';
    return `${hours}h`;
  }

  function determinePriority(email: any) {
    if (email.isUnread && new Date(email.date).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
      return 'high';
    }
    return 'medium';
  }

  return (
    <div className="space-y-6">
      {isOffline && (
        <OfflineIndicator timestamp={emailData?.timestamp} />
      )}

      <MetricCard
        title="Immediate Attention Needed"
        metric={{
          icon: AlertCircle,
          title: "Priority Actions",
          calculation: "Based on email response times and meeting preparation needs",
          importance: "Helps focus on most time-sensitive tasks",
          actions: [
            "Address high-priority emails first",
            "Prepare for upcoming meetings",
            "Handle blocking requests"
          ]
        }}
      >
        <div className="space-y-3">
          {emailLoading ? (
            <div className="p-4 text-muted-foreground">Loading urgent items...</div>
          ) : urgentItems.length > 0 ? (
            urgentItems.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${
                  item.priority === 'high' ? 'bg-red-50' : 'bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-600">
                      From: {item.from}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Waited: {item.waited}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-muted-foreground">No urgent items</div>
          )}
        </div>
      </MetricCard>

      <div className="grid grid-cols-2 gap-6">
        <MetricCard
          title="Today's Schedule"
          metric={{
            icon: Calendar,
            title: "Meeting Schedule",
            calculation: "Compiled from your calendar events",
            importance: "Shows your time commitments and preparation needs",
            actions: [
              "Review meeting requirements",
              "Identify preparation needs",
              "Plan focus time between meetings"
            ]
          }}
        >
          <div className="space-y-3">
            {calendarLoading ? (
              <div className="p-4 text-muted-foreground">Loading schedule...</div>
            ) : calendarError ? (
              <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
                Error loading calendar: {calendarError.message}
              </div>
            ) : calendarData?.todaysMeetings.length ? (
              calendarData.todaysMeetings.map((meeting) => (
                <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{meeting.summary}</div>
                      <div className="text-sm text-gray-600">
                        {formatMeetingTime(meeting.start)} ({Math.round((new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60))}m)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.attendees}
                      </span>
                      {meeting.hangoutLink && (
                        <Video className="h-4 w-4 text-blue-500" />
                      )}
                      {meeting.isOptional && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-muted-foreground">No meetings scheduled</div>
            )}

            {calendarData?.focusTimeBlocks.length ? (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Focus Time Blocks</h4>
                {calendarData.focusTimeBlocks.map((block, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground">
                    {formatMeetingTime(block.start)} - {formatMeetingTime(block.end)}
                    {' '}({Math.round(block.duration)}m)
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </MetricCard>

        <MetricCard
          title="Communication Load"
          metric={{
            icon: Mail,
            title: "Email Metrics",
            calculation: "Analyzed from Gmail inbox and thread patterns",
            importance: "Understand communication demands and response needs",
            actions: [
              "Batch process non-urgent emails",
              "Set up response time expectations",
              "Identify delegation opportunities"
            ]
          }}
        >
          <div className="space-y-4">
            {emailError ? (
              <ErrorMessage error={emailError} onRetry={retry} />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {emailLoading ? '...' : emailData?.totalUnread || 0}
                  </div>
                  <div className="text-sm text-gray-600">Unread</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {emailLoading ? '...' : emailData?.needingResponse || 0}
                  </div>
                  <div className="text-sm text-gray-600">Need Response</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {emailLoading ? '...' : emailData?.activeThreads || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Threads</div>
                </div>
              </div>
            )}
          </div>
        </MetricCard>
      </div>
    </div>
  );
};

export default CurrentWorkloadTab;
