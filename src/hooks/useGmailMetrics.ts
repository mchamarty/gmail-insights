import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRetry } from './useRetry';
import type { EmailMetrics } from '@/lib/gmail';
import { EmbeddingsManager, EmailContent } from '../lib/embeddings';
import { RelationshipGraph } from '../lib/relationshipGraph';

interface EnhancedEmailMetrics extends EmailMetrics {
  relationships: {
    topCollaborators: Array<{
      email: string;
      name: string;
      strength: number;
      lastInteraction: Date;
    }>;
    activeProjects: string[];
  };
  contextualInsights: Array<{
    type: 'action' | 'pattern' | 'suggestion';
    content: string;
    priority: 'high' | 'medium' | 'low';
    context: string[];
  }>;
}

export function useGmailMetrics() {
  const { data: session } = useSession();
  const [isOffline, setIsOffline] = useState(false);
  const embeddings = EmbeddingsManager.getInstance();
  const graph = RelationshipGraph.getInstance();

  const processEmails = async (metrics: EmailMetrics): Promise<EnhancedEmailMetrics> => {
    const enhancedMetrics: EnhancedEmailMetrics = {
      ...metrics,
      relationships: {
        topCollaborators: [],
        activeProjects: []
      },
      contextualInsights: []
    };

    try {
      // Process each email through embeddings and graph
      for (const email of metrics.emails || []) {
        const emailContent: EmailContent = {
          id: email.id,
          subject: email.subject,
          body: email.snippet,
          from: email.from,
          to: email.to,
          timestamp: new Date(email.date)
        };

        const vector = await embeddings.vectorizeEmail(emailContent);
        graph.addInteraction(emailContent);

        // Generate insights based on urgency
        if (vector.metadata.urgency === 'high') {
          enhancedMetrics.contextualInsights.push({
            type: 'action',
            content: `Urgent response needed: ${email.subject}`,
            priority: 'high',
            context: [email.subject]
          });
        }
      }

      // Get relationship data
      const mostActive = graph.getMostActiveNodes(5);
      enhancedMetrics.relationships.topCollaborators = mostActive.map(node => ({
        email: node.metadata.email!,
        name: node.metadata.name,
        strength: node.metadata.importance,
        lastInteraction: node.metadata.lastSeen
      }));

      return enhancedMetrics;
    } catch (error) {
      console.error('Error processing emails:', error);
      return enhancedMetrics;
    }
  };

  const fetchGmailMetrics = useCallback(async () => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/gmail/metrics', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} - ${response.statusText}`);
    }

    const basicMetrics = await response.json() as EmailMetrics;
    return processEmails(basicMetrics);
  }, [session]);

  const { 
    data, 
    isLoading, 
    error, 
    retry 
  } = useRetry<EnhancedEmailMetrics>(fetchGmailMetrics, [session]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      retry();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retry]);

  return { 
    data, 
    isLoading, 
    error, 
    isOffline, 
    retry 
  };
}