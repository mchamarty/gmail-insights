import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}

const baseUrl = "https://orange-eureka-97jw7v457wqx376vx-3000.app.github.dev";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          redirect_uri: `${baseUrl}/api/auth/callback/google`,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/api/auth/error",
  },
  debug: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };