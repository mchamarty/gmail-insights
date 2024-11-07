import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getCalendarMetrics } from '@/lib/calendar';
import { handleGoogleAPIError } from '@/lib/errors';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';  // Updated path

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const metrics = await getCalendarMetrics(session.accessToken as string);
    return NextResponse.json(metrics);
    
  } catch (error) {
    const apiError = handleGoogleAPIError(error);
    return NextResponse.json(
      { error: apiError.message }, 
      { status: apiError.status }
    );
  }
}