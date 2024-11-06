'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';
import { 
  Clock, Calendar, Mail, Users, HelpCircle, ChevronUp, ChevronDown 
} from 'lucide-react';
import { useCalendarMetrics } from '@/hooks/useCalendarMetrics';
import {OfflineIndicator} from '../ui/offline-indicator';
import {ErrorMessage} from '../ui/error-message';

// Types
interface Metric {
  title: string;
  icon?: any;
  calculation: string;
  importance: string;
  actions: string[];
}

// Utility Components
const InsightTooltip: React.FC<{ metric: Metric }> = ({ metric }) => (
  <div className="absolute z-50 w-80 p-4 bg-white border rounded-lg shadow-lg">
    <div className="font-semibold mb-2 text-lg">{metric.title}</div>
    <div className="space-y-4">
      <div>
        <div className="font-medium text-gray-700">How is this calculated?</div>
        <div className="text-sm text-gray-600">{metric.calculation}</div>
      </div>
      <div>
        <div className="font-medium text-gray-700">Why does this matter?</div>
        <div className="text-sm text-gray-600">{metric.importance}</div>
      </div>
      <div>
        <div className="font-medium text-gray-700">What can you do?</div>
        <ul className="text-sm text-gray-600 list-disc pl-4">
          {metric.actions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const MetricCard: React.FC<{
  title: string;
  metric: Metric;
  children: React.ReactNode;
}> = ({ title, metric, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {metric.icon && <metric.icon className="h-5 w-5" />}
          <span className="flex-grow">{title}</span>
          <button
            className="ml-2 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <HelpCircle className="h-4 w-4 text-gray-400" />
            {showTooltip && <InsightTooltip metric={metric} />}
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isExpanded ? '' : 'max-h-64 overflow-hidden'}`}>
        {children}
      </CardContent>
    </Card>
  );
};

// Main Component
const TimeConsumptionTab: React.FC<{ timeframe: string }> = ({ timeframe }) => {
  const { data: calendarData, isLoading, error, isOffline, retry } = useCalendarMetrics();

  // Placeholder data if the API fetch fails
  const timeDistribution = calendarData?.timeDistribution || [
    { hour: '9AM', meetings: 2, focus: 1, communication: 1 },
    { hour: '10AM', meetings: 3, focus: 0, communication: 1 },
    { hour: '11AM', meetings: 1, focus: 2, communication: 1 },
    { hour: '12PM', meetings: 0, focus: 2, communication: 1 },
    { hour: '1PM', meetings: 2, focus: 0, communication: 2 },
    { hour: '2PM', meetings: 3, focus: 0, communication: 1 },
    { hour: '3PM', meetings: 1, focus: 2, communication: 1 },
    { hour: '4PM', meetings: 2, focus: 1, communication: 1 },
    { hour: '5PM', meetings: 0, focus: 2, communication: 1 }
  ];

  const participantData = calendarData?.participantData || [
    { team: 'Engineering', hours: 12, threads: 25, meetings: 8 },
    { team: 'Product', hours: 8, threads: 18, meetings: 5 },
    { team: 'Leadership', hours: 6, threads: 15, meetings: 4 },
    { team: 'Cross-functional', hours: 10, threads: 20, meetings: 6 }
  ];

  const weeklyPatterns = calendarData?.weeklyPatterns || {
    meetingLoad: [
      { day: 'Monday', morning: 3, afternoon: 2 },
      { day: 'Tuesday', morning: 4, afternoon: 3 },
      { day: 'Wednesday', morning: 2, afternoon: 4 },
      { day: 'Thursday', morning: 3, afternoon: 2 },
      { day: 'Friday', morning: 2, afternoon: 1 }
    ],
    topActivities: [
      { activity: 'Project Reviews', hours: 8, type: 'meetings' },
      { activity: 'Team Syncs', hours: 6, type: 'meetings' },
      { activity: 'Documentation', hours: 5, type: 'focus' },
      { activity: 'Code Review', hours: 4, type: 'focus' }
    ]
  };

  return (
    <div className="space-y-6">
      {isOffline && <OfflineIndicator />}

      {error ? (
        <ErrorMessage error={error} onRetry={retry} />
      ) : (
        <>
          <MetricCard
            title="Daily Time Distribution"
            metric={{
              icon: Clock,
              title: "Time Allocation",
              calculation: "Analyzed from calendar events and email activity timestamps",
              importance: "Understand your daily work patterns and identify optimization opportunities",
              actions: [
                "Identify and protect your peak productivity hours",
                "Batch similar activities together",
                "Create dedicated communication blocks"
              ]
            }}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="meetings" 
                    stackId="1"
                    stroke="#4f46e5" 
                    fill="#4f46e5" 
                    fillOpacity={0.6}
                    name="Meetings"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="focus" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Focus Time"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="communication" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Communication"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </MetricCard>

          {/* Remaining MetricCards for Team Collaboration Analysis and Weekly Activity Patterns */}
          {/* The rest of the code here remains as before */}
        </>
      )}
    </div>
  );
};

export default TimeConsumptionTab;
