import { EmailContent } from './embeddings';
import { EmbeddingsManager } from './embeddings';
import { RelationshipGraph } from './relationshipGraph';

interface ContextMemory {
  shortTerm: Map<string, {
    content: EmailContent;
    timestamp: Date;
    importance: number;
  }>;
  mediumTerm: Map<string, {
    project: string;
    participants: string[];
    lastUpdate: Date;
    status: 'active' | 'pending' | 'completed';
  }>;
  longTerm: Map<string, {
    pattern: string;
    frequency: number;
    lastObserved: Date;
    confidence: number;
  }>;
}

export class ContextManagerClass {
  private memory: ContextMemory;
  private embeddings: EmbeddingsManager;
  private graph: RelationshipGraph;
  private static instance: ContextManagerClass;

  constructor() {
    this.memory = {
      shortTerm: new Map(),
      mediumTerm: new Map(),
      longTerm: new Map()
    };
    this.embeddings = EmbeddingsManager.getInstance();
    this.graph = RelationshipGraph.getInstance();
  }

  public static getInstance(): ContextManagerClass {
    if (!ContextManagerClass.instance) {
      ContextManagerClass.instance = new ContextManagerClass();
    }
    return ContextManagerClass.instance;
  }

  async updateContext(email: EmailContent): Promise<void> {
    // Update short-term memory
    this.memory.shortTerm.set(email.id, {
      content: email,
      timestamp: email.timestamp,
      importance: this.calculateImportance(email)
    });

    // Update medium-term projects
    const projectKey = this.extractProjectKey(email);
    if (projectKey) {
      this.updateProjectContext(projectKey, email);
    }

    // Update long-term patterns
    this.updatePatterns(email);

    // Clean up old entries
    this.pruneMemory();
  }

  async getRelevantContext(query: string): Promise<{
    recentContext: EmailContent[];
    relatedPatterns: string[];
    relationships: any[];
  }> {
    const recentEmails = Array.from(this.memory.shortTerm.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(item => item.content)
      .slice(0, 5);

    const patterns = Array.from(this.memory.longTerm.values())
      .filter(pattern => pattern.confidence > 0.7)
      .map(pattern => pattern.pattern);

    const relationships = this.graph.getMostActiveNodes(5);

    return {
      recentContext: recentEmails,
      relatedPatterns: patterns,
      relationships
    };
  }

  private calculateImportance(email: EmailContent): number {
    const urgencyIndicators = ['urgent', 'asap', 'important', 'priority'];
    const hasUrgentWords = urgencyIndicators.some(word => 
      email.subject.toLowerCase().includes(word) || 
      email.body.toLowerCase().includes(word)
    );
    
    return hasUrgentWords ? 1.5 : 1.0;
  }

  private extractProjectKey(email: EmailContent): string | null {
    const projectRegex = /\b(?:project|initiative|launch)[\s:-]+([^\n.,]+)/i;
    const match = email.subject.match(projectRegex) || email.body.match(projectRegex);
    return match ? match[1].trim().toLowerCase() : null;
  }

  private updateProjectContext(projectKey: string, email: EmailContent): void {
    const existing = this.memory.mediumTerm.get(projectKey);
    this.memory.mediumTerm.set(projectKey, {
      project: projectKey,
      participants: [...new Set([
        ...(existing?.participants || []),
        email.from,
        ...email.to
      ])],
      lastUpdate: email.timestamp,
      status: 'active'
    });
  }

  private updatePatterns(email: EmailContent): void {
    const timeOfDay = email.timestamp.getHours();
    const dayOfWeek = email.timestamp.getDay();

    const patterns = [
      `Communication at ${timeOfDay}:00`,
      `Active on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}`
    ];

    patterns.forEach(pattern => {
      const existing = this.memory.longTerm.get(pattern) || {
        pattern,
        frequency: 0,
        lastObserved: new Date(0),
        confidence: 0
      };

      this.memory.longTerm.set(pattern, {
        ...existing,
        frequency: existing.frequency + 1,
        lastObserved: email.timestamp,
        confidence: Math.min(existing.confidence + 0.1, 1)
      });
    });
  }

  private pruneMemory(): void {
    const now = new Date();
    
    // Remove short-term items older than 24 hours
    Array.from(this.memory.shortTerm.entries()).forEach(([id, item]) => {
      if (now.getTime() - item.timestamp.getTime() > 24 * 60 * 60 * 1000) {
        this.memory.shortTerm.delete(id);
      }
    });

    // Archive inactive projects
    Array.from(this.memory.mediumTerm.entries()).forEach(([key, project]) => {
      if (now.getTime() - project.lastUpdate.getTime() > 7 * 24 * 60 * 60 * 1000) {
        const existingProject = this.memory.mediumTerm.get(key);
        if (existingProject) {
          this.memory.mediumTerm.set(key, {
            ...existingProject,
            status: 'completed'
          });
        }
      }
    });

    // Decay pattern confidence over time
    Array.from(this.memory.longTerm.entries()).forEach(([key, pattern]) => {
      const daysSinceLastObserved = 
        (now.getTime() - pattern.lastObserved.getTime()) / (1000 * 60 * 60 * 24);
      const existingPattern = this.memory.longTerm.get(key);
      if (existingPattern) {
        this.memory.longTerm.set(key, {
          ...existingPattern,
          confidence: existingPattern.confidence * Math.exp(-daysSinceLastObserved / 30)
        });
      }
    });
  }
}

// Export a type and singleton instance
export type ContextManager = ContextManagerClass;
export const ContextManager = ContextManagerClass;