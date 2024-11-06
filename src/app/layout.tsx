import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import SignInButton from '@/components/SignInButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gmail Productivity Dashboard',
  description: 'Analyze your work patterns and optimize your productivity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head />
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <NextAuthProvider>
          <header className="p-4 border-b bg-white shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-lg font-semibold">Gmail Productivity Dashboard</h1>
              <SignInButton />
            </div>
          </header>
          <main>{children}</main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
