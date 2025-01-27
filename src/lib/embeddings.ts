import OpenAI from 'openai';

export type EmbeddingVector = number[];

export interface EmailContent {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  timestamp: Date;
  threadId?: string;
  labels?: string[];
}

export interface EnhancedEmailVector {
  emailId: string;
  vector: EmbeddingVector;
  metadata: {
    participants: string[];
    timestamp: Date;
    topics: string[];
    summary?: string;
    sentiment?: string;
    urgency?: 'high' | 'medium' | 'low';
  }
}

export class EmbeddingsManager {
  private openai: OpenAI;
  private vectorStore: Map<string, EnhancedEmailVector>;
  private static instance: EmbeddingsManager;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. Some features will be limited.');
      // Instead of throwing, set a flag
      this.openai = null as any;
      this.vectorStore = new Map();
      return;
    }
  
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.vectorStore = new Map();
  }

  public static getInstance(): EmbeddingsManager {
    if (!EmbeddingsManager.instance) {
      EmbeddingsManager.instance = new EmbeddingsManager();
    }
    return EmbeddingsManager.instance;
  }

  private async getEmbedding(text: string): Promise<EmbeddingVector> {
    if (!this.openai) {
      console.warn('OpenAI not configured. Returning empty embedding.');
      return new Array(1536).fill(0); // Return zero vector
    }
  
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
        encoding_format: "float",
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      return new Array(1536).fill(0); // Return zero vector on error
    }
  }

  private async analyzeContent(email: EmailContent): Promise<{
    topics: string[];
    summary: string;
    sentiment: string;
    urgency: 'high' | 'medium' | 'low';
  }> {
    if (!this.openai) {
      return {
        topics: [],
        summary: 'OpenAI not configured',
        sentiment: 'neutral',
        urgency: 'medium'
      };
    }
  
    try {
      const prompt = `
        Analyze the following email and provide structured insights.
        Format your response exactly as shown, with each element on a new line:
        
        1. TOPICS: List key topics, separated by commas
        2. SUMMARY: One-line summary of the main point
        3. SENTIMENT: Exactly one of (positive, negative, neutral)
        4. URGENCY: Exactly one of (high, medium, low) based on:
           - high: immediate action needed, time-sensitive
           - medium: needs attention but not immediate
           - low: informational or no action needed
  
        Email Subject: ${email.subject}
        Email Body: ${email.body}
  
        Respond with exactly 4 lines, no additional text.
        `;
  
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an email analysis expert. Provide concise, accurate analysis in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-4",
        temperature: 0.3, // Lower temperature for more consistent responses
        max_tokens: 500,
        presence_penalty: 0,
        frequency_penalty: 0,
      });
  
      const analysis = completion.choices[0].message?.content || '';
      const lines = analysis.split('\n').filter(line => line.trim());
  
      // Ensure we have exactly 4 lines
      if (lines.length !== 4) {
        throw new Error('Invalid analysis format');
      }
  
      // Extract and validate each component
      const topics = lines[0]
        .replace(/^TOPICS:\s*/i, '')
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
  
      const summary = lines[1].replace(/^SUMMARY:\s*/i, '').trim();
      
      const sentiment = lines[2]
        .replace(/^SENTIMENT:\s*/i, '')
        .toLowerCase()
        .trim();
  
      const urgency = lines[3]
        .replace(/^URGENCY:\s*/i, '')
        .toLowerCase()
        .trim();
  
      // Validate sentiment and urgency
      if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
        throw new Error('Invalid sentiment value');
      }
  
      if (!['high', 'medium', 'low'].includes(urgency)) {
        throw new Error('Invalid urgency value');
      }
  
      return {
        topics: topics.length > 0 ? topics : ['unspecified'],
        summary: summary || 'No summary available',
        sentiment: sentiment as 'positive' | 'negative' | 'neutral',
        urgency: urgency as 'high' | 'medium' | 'low'
      };
  
    } catch (error) {
      console.error("Error analyzing content:", error);
      // Provide more context in the fallback response
      const hasSubject = email.subject.length > 0;
      return {
        topics: hasSubject ? [email.subject.toLowerCase()] : ['unspecified'],
        summary: hasSubject ? email.subject : 'Analysis failed',
        sentiment: 'neutral',
        urgency: 'medium'
      };
    }
  }

  public async vectorizeEmail(email: EmailContent): Promise<EnhancedEmailVector> {
    try {
      const combinedContent = `${email.subject} ${email.body}`;
      
      // Process embedding and analysis in parallel
      const [vector, analysis] = await Promise.all([
        this.getEmbedding(combinedContent),
        this.analyzeContent(email)
      ]);
      
      const enhancedVector: EnhancedEmailVector = {
        emailId: email.id,
        vector,
        metadata: {
          participants: [email.from, ...email.to],
          timestamp: email.timestamp,
          topics: analysis.topics,
          summary: analysis.summary,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency
        }
      };

      this.vectorStore.set(email.id, enhancedVector);
      return enhancedVector;
    } catch (error) {
      console.error("Error vectorizing email:", error);
      throw new Error("Failed to vectorize email");
    }
  }

  public async findSimilarContexts(
    vector: EmbeddingVector, 
    threshold: number = 0.8,
    limit: number = 5
  ): Promise<EnhancedEmailVector[]> {
    const similarities: Array<[string, number]> = [];

    for (const [emailId, storedVector] of this.vectorStore.entries()) {
      const similarity = this.cosineSimilarity(vector, storedVector.vector);
      similarities.push([emailId, similarity]);
    }

    return similarities
      .sort(([, a], [, b]) => b - a)
      .filter(([, similarity]) => similarity >= threshold)
      .slice(0, limit)
      .map(([emailId]) => this.vectorStore.get(emailId)!)
      .filter(Boolean);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  public clearVectorStore(): void {
    this.vectorStore.clear();
  }

  public getVectorCount(): number {
    return this.vectorStore.size;
  }
}