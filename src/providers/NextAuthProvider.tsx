'use client';

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Make sure to use a named export, not default export
export function NextAuthProvider({ children }: Props) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}