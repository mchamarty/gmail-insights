import { LucideIcon } from 'lucide-react';

export interface Metric {
  title: string;
  icon?: LucideIcon;
  calculation: string;
  importance: string;
  actions: string[];
}

export interface TimeAllocation {
  hours: number;
  percentage: number;
  trend: {
    current: number;
    previous: number;
  };
}

export interface ProjectMetric {
  name: string;
  hours: number;
  meetings: number;
  threads: number;
  collaborators: number;
  status: 'active' | 'completed' | 'planned';
  impact: 'high' | 'medium' | 'low';
}

export interface FocusTimeMetric {
  planned: number;
  achieved: number;
  interruptions: number;
  day: string;
}

export interface CollaborationMetric {
  team: string;
  hours: number;
  threads: number;
  meetings: number;
}

export interface MeetingMetric {
  time: string;
  title: string;
  duration: string;
  attendees: number;
  required: boolean;
}

export interface EmailMetric {
  unreadCount: number;
  needingResponse: number;
  activeThreads: number;
}