import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GaxiosError } from 'gaxios';

export interface EmailMetrics {
  totalUnread: number;
  needingResponse: number;
  activeThreads: number;
  recentEmails: Array<{
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
    isUnread: boolean;
    hasAttachments: boolean;
  }>;
  timestamp?: string;
}

interface GmailError extends Error {
  response?: {
    status: number;
  };
}

const createOAuth2Client = (accessToken: string): OAuth2Client => {
  console.log('Creating OAuth2Client with token preview:', accessToken.substring(0, 10) + '...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ 
    access_token: accessToken,
    scope: "https://www.googleapis.com/auth/gmail.readonly"
  });

  return oauth2Client;
};

export const getGmailClient = (accessToken: string) => {
  const oauth2Client = createOAuth2Client(accessToken);
  
  oauth2Client.on('tokens', (tokens) => {
    console.log('Token refresh occurred');
    if (tokens.access_token) {
      oauth2Client.setCredentials(tokens);
    }
  });

  return google.gmail({ 
    version: 'v1', 
    auth: oauth2Client
  });
};

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: unknown) {
    if (retries > 0 && error instanceof Error) {
      const gmailError = error as GmailError;
      const status = gmailError.response?.status;
      
      if (status === 401 || status === 403 || status === 429 || (status && status >= 500)) {
        console.log(`Retrying operation, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2);
      }
    }
    throw error;
  }
};

export const getEmailMetrics = async (accessToken: string): Promise<EmailMetrics> => {
  console.log('Starting email metrics fetch...');
  const gmail = getGmailClient(accessToken);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const query = `after:${Math.floor(sevenDaysAgo.getTime() / 1000)}`;

  try {
    console.log('Fetching multiple Gmail endpoints...');
    
    const [unreadResponse, threadsResponse, messagesResponse] = await Promise.all([
      retryOperation(() => gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread in:inbox',
      })),
      retryOperation(() => gmail.users.threads.list({
        userId: 'me',
        q: 'in:inbox',
        maxResults: 50,
      })),
      retryOperation(() => gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      })),
    ]);

    console.log('Initial responses received, processing threads...');

    const needingResponseCount = (threadsResponse.data.threads || [])
      .filter(thread => thread.id && !thread.id.includes('sent'))
      .length;

    console.log('Fetching message details...');
    
    const recentEmails = await Promise.all(
      (messagesResponse.data.messages || []).slice(0, 10).map(async (message) => {
        const detail = await retryOperation(() => gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        }));

        const headers = detail.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return {
          id: message.id!,
          threadId: detail.data.threadId!,
          snippet: detail.data.snippet || '',
          subject,
          from: from.split('<')[0].trim(),
          date: new Date(date).toISOString(),
          isUnread: detail.data.labelIds?.includes('UNREAD') || false,
          hasAttachments: Boolean(detail.data.payload?.parts?.some(part => part.filename)),
        };
      })
    );

    console.log('Email metrics fetch completed successfully');

    return {
      totalUnread: unreadResponse.data.resultSizeEstimate || 0,
      needingResponse: needingResponseCount,
      activeThreads: threadsResponse.data.resultSizeEstimate || 0,
      recentEmails,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error('Error fetching email metrics:', error);
    
    if (error instanceof Error) {
      const gmailError = error as GmailError;
      if (gmailError.response?.status === 401) {
        throw new Error('Authentication failed. Please sign out and sign in again.');
      }
      if (gmailError.response?.status === 403) {
        throw new Error('Access forbidden. Please check Gmail API permissions.');
      }
    }
    
    throw error;
  }
};