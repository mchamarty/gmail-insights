import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { getEmailMetrics } from '@/lib/gmail';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const metrics = await getEmailMetrics(session.accessToken as string);
    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Gmail API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email metrics' }, 
      { status: 500 }
    );
  }
}