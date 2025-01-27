export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isUnread: boolean;
  hasAttachments?: boolean;
  importance?: 'high' | 'medium' | 'low';
}

export interface EmailMetrics {
  totalEmails: number;
  totalUnread?: number;
  needingResponse?: number;
  activeThreads?: number;
  dateRange: {
    start: string;
    end: string;
  };
  topSenders: [string, number][];
  recentEmails: Array<{
    id: string;
    threadId?: string;
    subject: string;
    from: string;
    date: string;
    isUnread: boolean;
    hasAttachments?: boolean;
    snippet?: string;
  }>;
  timestamp?: string;
}

export interface ContactDetail {
  name: string;
  email: string;
  phone: string;
  relationshipStrength?: number;
  lastInteraction?: string;
  communicationPattern?: {
    responseTime: number;
    preferredTime?: string;
    frequency: number;
  };
  projects?: string[];
  role?: string;
  recentInteractions?: {
    date: string;
    type: string;
    context: string;
  }[];
}

export interface RelationshipInsight {
  person: string;
  role?: string;
  strength: number;
  projects: string[];
  interactions: {
    frequency: number;
    lastDate: string;
    commonTopics: string[];
    patterns?: {
      timeOfDay?: string[];
      responseTime?: number;
      threadLength?: number;
    };
  };
  influence?: number;
  dependencies?: string[];
}

export interface ContextualInsight {
  type: 'action' | 'pattern' | 'suggestion';
  content: string;
  priority: 'high' | 'medium' | 'low';
  context: string[];
  relatedPeople?: string[];
  dueDate?: string;
  source?: {
    emailId?: string;
    threadId?: string;
    pattern?: string;
  };
  confidence?: number;
  impact?: 'high' | 'medium' | 'low';
}

export interface TopicNode {
  id: string;
  group: number;
  weight?: number;
  category?: string;
}

export interface TopicLink {
  source: string;
  target: string;
  value: number;
  type?: string;
}

export interface TopicCluster {
  nodes: TopicNode[];
  links: TopicLink[];
  metadata?: {
    dominantTopics: string[];
    timeRange: { start: string; end: string };
    participants: string[];
  };
}

export interface EmailEntities {
  people: string[];
  organizations: string[];
  places: string[];
  projects?: string[];
  dates?: string[];
  keywords?: string[];
}

export interface CommunicationPatterns {
  busyPeriods: Array<{ day: string; hour: number; volume: number }>;
  responseMetrics: {
    averageTime: number;
    bestTime: string;
    outliers?: {
      slow: number;
      fast: number;
    };
  };
  patterns?: {
    dailyTrends: Record<string, number>;
    weeklyTrends: Record<string, number>;
    commonThreads: Array<{
      participants: string[];
      frequency: number;
      topics: string[];
    }>;
  };
}

export interface EmailAnalysisResult {
  metrics: EmailMetrics;
  analysis: string;
  entities: EmailEntities;
  contactDetails: ContactDetail[];
  topicClusters: TopicCluster;
  timeframe: string;
  contextualInsights: ContextualInsight[];
  relationships: {
    topCollaborators: RelationshipInsight[];
    activeProjects: string[];
    communicationPatterns: CommunicationPatterns;
    networkMetrics?: {
      centralPeople: string[];
      clusters: Array<{
        members: string[];
        commonTopics: string[];
      }>;
    };
  };
}