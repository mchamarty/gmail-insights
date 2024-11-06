'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend 
} from 'recharts';
import { 
  Target, Users, Clock, HelpCircle, ChevronUp, ChevronDown 
} from 'lucide-react';
import { useGmailMetrics } from '@/hooks/useGmailMetrics';
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
const WorkloadImpactTab: React.FC<{ timeframe: string }> = ({ timeframe }) => {
  const { data: emailData, isLoading, error, isOffline, retry } = useGmailMetrics();

  // Placeholder data if the API fetch fails
  const projectData = emailData?.projectData || {
    workload: [
      { 
        name: "Q4 Planning", 
        hours: 15, 
        meetings: 8, 
        threads: 25,
        collaborators: 12,
        status: "active",
        impact: "high",
        details: [
          "Leading architecture decisions",
          "Coordinating 3 teams",
          "Weekly status to leadership"
        ]
      },
      { 
        name: "Tech Reviews", 
        hours: 12, 
        meetings: 6, 
        threads: 18,
        collaborators: 8,
        status: "active",
        impact: "medium",
        details: [
          "Code review coordination",
          "Technical documentation",
          "Team enablement"
        ]
      }
    ],
    weeklyEngagement: [
      { day: 'Mon', meetings: 4, emails: 25, reviews: 5 },
      { day: 'Tue', meetings: 6, emails: 30, reviews: 3 },
      { day: 'Wed', meetings: 3, emails: 28, reviews: 4 },
      { day: 'Thu', meetings: 5, emails: 22, reviews: 6 },
      { day: 'Fri', meetings: 4, emails: 20, reviews: 4 }
    ]
  };

  const stakeholderData = emailData?.stakeholderData || {
    interactions: [
      { group: "Engineering", direct: 45, indirect: 15, total: 60 },
      { group: "Product", direct: 35, indirect: 10, total: 45 }
    ],
    keyThreads: [
      { 
        topic: "Architecture Review",
        participants: 8,
        messages: 24,
        lastActive: "2h ago",
        priority: "high"
      }
    ]
  };

  const impactMetrics = emailData?.impactMetrics || {
    deliverables: [
      { category: "Technical Decisions", count: 15 },
      { category: "Process Improvements", count: 8 },
    ],
    completion: [
      { week: 'W1', planned: 8, completed: 7 },
      { week: 'W2', planned: 10, completed: 9 }
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
            title="Project Impact Overview"
            metric={{
              icon: Target,
              title: "Work Distribution",
              calculation: "Aggregated from calendar events, email threads, and document interactions",
              importance: "Demonstrate the breadth and depth of your contributions",
              actions: [
                "Use for 1:1 discussions with manager",
                "Identify areas needing attention",
                "Track progress on key initiatives"
              ]
            }}
          >
            <div className="space-y-4">
              {/* Project Data Cards */}
              {projectData.workload.map((project: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  {/* Project Details */}
                </div>
              ))}
            </div>
          </MetricCard>

          {/* Remaining MetricCards for Stakeholder Engagement and Impact & Deliverables */}
        </>
      )}
    </div>
  );
};

export default WorkloadImpactTab;
