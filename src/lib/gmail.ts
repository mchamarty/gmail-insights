import { google } from 'googleapis';

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
}

export const getGmailClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const getEmailMetrics = async (accessToken: string): Promise<EmailMetrics> => {
  const gmail = getGmailClient(accessToken);
  
  // Get messages from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const query = `after:${Math.floor(sevenDaysAgo.getTime() / 1000)}`;

  try {
    const [unreadResponse, threadsResponse, messagesResponse] = await Promise.all([
      gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread in:inbox',
      }),
      gmail.users.threads.list({
        userId: 'me',
        q: 'in:inbox',
        maxResults: 50,
      }),
      gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      }),
    ]);

    const needingResponseCount = (threadsResponse.data.threads || []).filter(thread =>
      thread.id && !thread.id.includes('sent')).length;

    const recentEmails = await Promise.all(
      (messagesResponse.data.messages || []).slice(0, 10).map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });

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

    return {
      totalUnread: unreadResponse.data.resultSizeEstimate || 0,
      needingResponse: needingResponseCount,
      activeThreads: threadsResponse.data.resultSizeEstimate || 0,
      recentEmails,
    };
  } catch (error) {
    console.error('Error fetching email metrics:', error);
    throw error;
  }
};
