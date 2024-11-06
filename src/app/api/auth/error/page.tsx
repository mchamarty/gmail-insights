'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="container mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            {error === 'Configuration' && 'There is a problem with the server configuration.'}
            {error === 'AccessDenied' && 'You do not have permission to sign in.'}
            {error === 'Verification' && 'The sign in link is no longer valid.'}
            {!error && 'An unknown error occurred.'}
          </p>
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}