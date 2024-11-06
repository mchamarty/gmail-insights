import { getServerSession } from 'next-auth/next';
import { google, gmail_v1 } from 'googleapis';
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';

// Ensure the Session type includes accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

export async function GET() {
  try {
    const session = (await getServerSession()) as Session;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: 'Access token not available' },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get recent messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 100,
      q: 'in:inbox', // Query for inbox messages
    });

    const messages = (response.data.messages || []).filter(
      (message): message is gmail_v1.Schema$Message => !!message.id
    );

    const messageDetails = await Promise.all(
      messages.slice(0, 10).map(async (message: gmail_v1.Schema$Message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });
        return detail.data;
      })
    );

    return NextResponse.json(messageDetails);
  } catch (error) {
    console.error('Gmail API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
