import { EmailContent } from './embeddings';

export type NodeType = 'person' | 'topic' | 'project' | 'thread';
export type EdgeType = 'collaborates' | 'manages' | 'contributes' | 'participates';

export interface Node {
  id: string;
  type: NodeType;
  metadata: {
    name: string;
    email?: string;
    firstSeen: Date;
    lastSeen: Date;
    importance: number;
    properties: Record<string, any>;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  strength: number;
  metadata: {
    firstInteraction: Date;
    lastInteraction: Date;
    frequency: number;
    context: string[];
    properties: Record<string, any>;
  };
}

export class RelationshipGraph {
  private nodes: Map<string, Node>;
  private edges: Map<string, Edge>;
  private static instance: RelationshipGraph;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  public static getInstance(): RelationshipGraph {
    if (!RelationshipGraph.instance) {
      RelationshipGraph.instance = new RelationshipGraph();
    }
    return RelationshipGraph.instance;
  }

  private generateEdgeId(source: string, target: string): string {
    return `${source}-${target}`;
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  public addPerson(email: string, name?: string): Node {
    const normalizedEmail = this.normalizeEmail(email);
    if (!this.nodes.has(normalizedEmail)) {
      const node: Node = {
        id: normalizedEmail,
        type: 'person',
        metadata: {
          name: name || email.split('@')[0],
          email: normalizedEmail,
          firstSeen: new Date(),
          lastSeen: new Date(),
          importance: 1,
          properties: {}
        }
      };
      this.nodes.set(normalizedEmail, node);
    }
    return this.nodes.get(normalizedEmail)!;
  }

  public addInteraction(email: EmailContent): void {
    const from = this.addPerson(email.from);
    const participants = email.to.map(to => this.addPerson(to));

    // Update node metadata
    from.metadata.lastSeen = email.timestamp;
    participants.forEach(p => {
      p.metadata.lastSeen = email.timestamp;
    });

    // Create or update edges
    participants.forEach(to => {
      const edgeId = this.generateEdgeId(from.id, to.id);
      const existingEdge = this.edges.get(edgeId);

      if (existingEdge) {
        existingEdge.strength += 1;
        existingEdge.metadata.lastInteraction = email.timestamp;
        existingEdge.metadata.frequency = this.calculateFrequency(existingEdge);
        existingEdge.metadata.context.push(email.subject);
      } else {
        const edge: Edge = {
          id: edgeId,
          source: from.id,
          target: to.id,
          type: 'collaborates',
          strength: 1,
          metadata: {
            firstInteraction: email.timestamp,
            lastInteraction: email.timestamp,
            frequency: 1,
            context: [email.subject],
            properties: {}
          }
        };
        this.edges.set(edgeId, edge);
      }
    });
  }

  private calculateFrequency(edge: Edge): number {
    const daysSinceFirst = (edge.metadata.lastInteraction.getTime() - 
      edge.metadata.firstInteraction.getTime()) / (1000 * 60 * 60 * 24);
    return edge.strength / (daysSinceFirst || 1);
  }

  public findRelationshipPatterns(nodeId: string): {
    collaborators: Array<{ node: Node; strength: number }>;
    projects: string[];
    frequency: Record<string, number>;
  } {
    const collaborators: Array<{ node: Node; strength: number }> = [];
    const projects = new Set<string>();
    const frequency: Record<string, number> = {};

    // Find all edges connected to this node
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        const otherId = edge.source === nodeId ? edge.target : edge.source;
        const otherNode = this.nodes.get(otherId);

        if (otherNode) {
          collaborators.push({
            node: otherNode,
            strength: edge.strength
          });

          // Track projects from context
          edge.metadata.context.forEach(ctx => projects.add(ctx));

          // Track interaction frequency
          const date = edge.metadata.lastInteraction.toISOString().split('T')[0];
          frequency[date] = (frequency[date] || 0) + 1;
        }
      }
    }

    return {
      collaborators: collaborators.sort((a, b) => b.strength - a.strength),
      projects: Array.from(projects),
      frequency
    };
  }

  public getNodeConnections(nodeId: string): Edge[] {
    return Array.from(this.edges.values())
      .filter(edge => edge.source === nodeId || edge.target === nodeId);
  }

  public getMostActiveNodes(limit: number = 5): Node[] {
    const nodeCounts = new Map<string, number>();
    
    for (const edge of this.edges.values()) {
      nodeCounts.set(edge.source, (nodeCounts.get(edge.source) || 0) + edge.strength);
      nodeCounts.set(edge.target, (nodeCounts.get(edge.target) || 0) + edge.strength);
    }

    return Array.from(nodeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  public getGraph(): { nodes: Node[]; edges: Edge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }
}