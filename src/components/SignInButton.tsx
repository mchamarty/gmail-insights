'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function SignInButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button onClick={() => signOut({ callbackUrl: '/' })}>
        Sign Out
      </button>
    );
  }

  return (
    <button onClick={() => signIn('google', { callbackUrl: '/' })}>
      Sign In with Google
    </button>
  );
}
