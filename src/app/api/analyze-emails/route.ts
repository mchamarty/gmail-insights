import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nlp from 'compromise';
import { getGmailClient } from '@/lib/gmail';
import { clusterTopics } from '@/lib/topicClustering';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { EmailAnalysisResult, EmailMetrics } from '@/types/email-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isUnread: boolean;
  hasAttachments?: boolean;
  snippet?: string | undefined;
}

async function fetchGmailMessages(accessToken: string, daysBack: number = 7): Promise<EmailMessage[]> {
  console.log('Fetching Gmail messages...');
  try {
    const gmail = getGmailClient(accessToken);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const query = `after:${Math.floor(startDate.getTime() / 1000)}`;

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    });

    console.log(`Found ${messagesResponse.data.messages?.length || 0} messages`);

    const emails = await Promise.all(
      (messagesResponse.data.messages || []).map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const headers = detail.data.payload?.headers || [];
        const emailMessage: EmailMessage = {
          id: message.id!,
          threadId: detail.data.threadId!,
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          to: headers.find(h => h.name === 'To')?.value || '',
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          body: detail.data.snippet || '',
          date: headers.find(h => h.name === 'Date')?.value || '',
          isUnread: detail.data.labelIds?.includes('UNREAD') || false,
          hasAttachments: detail.data.payload?.parts?.some(part => part.filename),
          snippet: detail.data.snippet || undefined
        };
        return emailMessage;
      })
    );

    console.log('Successfully fetched email details');
    return emails;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  console.log('API ROUTE HIT:', new Date().toISOString());
  
  try {
    // Read the body once at the start
    const body = await req.json();
    console.log('Request body:', body);
    const { days = 7 } = body;

    console.log('Starting email analysis...');
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      console.log('No session or access token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const emails = await fetchGmailMessages(session.accessToken, days);

    if (emails.length === 0) {
      console.log('No emails found in date range');
      return NextResponse.json({ error: 'No emails found in the specified date range' }, { status: 400 });
    }

    console.log(`Processing ${emails.length} emails`);

    const combinedContent = emails.map(email => 
      `From: ${email.from}\nSubject: ${email.subject}\n${email.body}`
    ).join('\n\n');

    console.log('Starting OpenAI analysis...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are analyzing work emails to provide professional insights.
                   Analyze the following aspects:
                   1. Role & Responsibilities
                   2. Key Projects/Workstreams
                   3. Communication Patterns
                   4. Time Allocation
                   5. Action Items & Next Steps
                   
                   Structure your response with clear sections and actionable insights.`
        },
        {
          role: "user",
          content: `Analyze these email communications:\n\n${combinedContent}`
        }
      ],
    });

    console.log('OpenAI analysis complete');

    console.log('Extracting entities...');
    const doc = nlp(combinedContent);
    const entities = {
      people: doc.people().out('array').filter(Boolean),
      organizations: doc.organizations().out('array').filter(Boolean),
      places: doc.places().out('array').filter(Boolean),
    };

    const result: EmailAnalysisResult = {
      metrics: {
        totalEmails: emails.length,
        dateRange: {
          start: new Date(Math.min(...emails.map(e => new Date(e.date).getTime()))).toISOString(),
          end: new Date(Math.max(...emails.map(e => new Date(e.date).getTime()))).toISOString(),
        },
        topSenders: Object.entries(
          emails.reduce((acc: Record<string, number>, email) => {
            acc[email.from] = (acc[email.from] || 0) + 1;
            return acc;
          }, {})
        ).sort(([, a], [, b]) => b - a).slice(0, 10),
        recentEmails: emails.map(email => ({
          id: email.id,
          threadId: email.threadId,
          subject: email.subject,
          from: email.from,
          date: email.date,
          isUnread: email.isUnread,
          hasAttachments: email.hasAttachments,
          snippet: email.snippet
        })).slice(0, 10)
      },
      analysis: completion.choices[0].message.content || '',
      entities,
      contactDetails: entities.people.map((person: string) => ({
        name: person,
        email: '',
        phone: '',
      })),
      topicClusters: clusterTopics([...entities.people, ...entities.organizations, ...entities.places]),
      timeframe: `Last ${days} days`,
      contextualInsights: [],
      relationships: {
        topCollaborators: [],
        activeProjects: [],
        communicationPatterns: {
          busyPeriods: [],
          responseMetrics: {
            averageTime: 0,
            bestTime: ''
          }
        }
      }
    };

    console.log('Analysis complete, returning results');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in email analysis:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}