export interface EmailMetrics {
  totalEmails: number;
  dateRange: {
    start: string;
    end: string;
  };
  topSenders: [string, number][];
  recentEmails: Array<{
    subject: string;
    from: string;
    date: string;
    isUnread: boolean;
  }>;
}

// Your existing interfaces remain the same
export interface ContactDetail {
  name: string;
  email: string;
  phone: string;
}

export interface TopicNode {
  id: string;
  group: number;
}

export interface TopicLink {
  source: string;
  target: string;
  value: number;
}

export interface TopicCluster {
  nodes: TopicNode[];
  links: TopicLink[];
}

export interface EmailEntities {
  people: string[];
  organizations: string[];
  places: string[];
}

export interface EmailAnalysisResult {
  metrics: EmailMetrics;
  analysis: string;
  entities: EmailEntities;
  contactDetails: ContactDetail[];
  topicClusters: TopicCluster;
  timeframe: string;
}