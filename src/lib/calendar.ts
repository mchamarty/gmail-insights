import { google } from 'googleapis';
import { handleGoogleAPIError } from './errors';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: number;
  isRecurring: boolean;
  isOptional: boolean;
  hangoutLink?: string | null;
}

export interface CalendarMetrics {
  todaysMeetings: CalendarEvent[];
  upcomingMeetings: CalendarEvent[];
  totalMeetingHours: number;
  focusTimeBlocks: Array<{ start: string; end: string; duration: number }>;
  meetingStats: {
    totalToday: number;
    optionalCount: number;
    backToBackCount: number;
    averageLength: number;
  };
  focusTimeData?: any;  // Define appropriate types here if possible
  calendarStability?: any;
  bufferAnalysis?: any;
  weeklyPatterns?: any;
  participantData?: any;
  timeDistribution?: any;
  
  // Newly added properties for compatibility with WorkloadImpactTab and CurrentWorkloadTab
  projectData?: {
    workload: Array<any>; // Define specific type if known
    weeklyEngagement: Array<any>;
  };
  stakeholderData?: {
    interactions: Array<any>;
    keyThreads: Array<any>;
  };
  impactMetrics?: {
    deliverables: Array<any>;
    completion: Array<any>;
  };
}

export const getCalendarClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getCalendarMetrics = async (accessToken: string): Promise<CalendarMetrics> => {
  const calendar = getCalendarClient(accessToken);
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const calendarEvents = events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'Untitled Event',
      start: event.start?.dateTime || '',
      end: event.end?.dateTime || '',
      attendees: event.attendees?.length || 0,
      isRecurring: !!event.recurringEventId,
      isOptional: event.attendees?.some(a => a.optional) || false,
      hangoutLink: event.hangoutLink,
    }));

    // Calculate metrics
    const totalMeetingMinutes = events.reduce((total, event) => {
      const start = new Date(event.start?.dateTime || '');
      const end = new Date(event.end?.dateTime || '');
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);

    // Count back-to-back meetings
    let backToBackCount = 0;
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = new Date(events[i].end?.dateTime || '');
      const nextStart = new Date(events[i + 1].start?.dateTime || '');
      if ((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60) < 15) {
        backToBackCount++;
      }
    }

    // Find focus time blocks (gaps > 30 minutes between meetings)
    const focusTimeBlocks = [];
    for (let i = 0; i < events.length - 1; i++) {
      const currentEnd = new Date(events[i].end?.dateTime || '');
      const nextStart = new Date(events[i + 1].start?.dateTime || '');
      const gap = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gap >= 30) {
        focusTimeBlocks.push({
          start: currentEnd.toISOString(),
          end: nextStart.toISOString(),
          duration: gap,
        });
      }
    }

    return {
      todaysMeetings: calendarEvents,
      upcomingMeetings: calendarEvents.filter(e => new Date(e.start) > now),
      totalMeetingHours: Math.round((totalMeetingMinutes / 60) * 10) / 10,
      focusTimeBlocks,
      meetingStats: {
        totalToday: events.length,
        optionalCount: calendarEvents.filter(e => e.isOptional).length,
        backToBackCount,
        averageLength: events.length ? Math.round(totalMeetingMinutes / events.length) : 0,
      },
      // Placeholder data for optional properties
      projectData: {
        workload: [],
        weeklyEngagement: [],
      },
      stakeholderData: {
        interactions: [],
        keyThreads: [],
      },
      impactMetrics: {
        deliverables: [],
        completion: [],
      }
    };
  } catch (error) {
    throw handleGoogleAPIError(error);
  }
};
