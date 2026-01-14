import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Retrieves the list of admin emails from environment variables.
 * Falls back to an empty array if not defined.
 */
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

/**
 * NextAuth Configuration Options
 */
const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * SignIn Callback
     * Controls access to the application based on email domain.
     * Only allows emails ending with "@mail.kmutt.ac.th".
     */
    async signIn({ user }) {
      if (user.email?.endsWith("@mail.kmutt.ac.th")) {
        return true;
      } else {
        console.warn(`Access Denied: Attempted login from non-KMUTT email (${user.email})`);
        return false;
      }
    },

    /**
     * JWT Callback
     * Assigns user roles (Admin vs. Student) during token creation.
     * This logic runs every time a user logs in or their session is updated.
     */
    async jwt({ token, user }) {
      if (user && user.email) {
        // Check if the user's email exists in the defined admin list
        const isAdmin = ADMIN_EMAILS.includes(user.email);
        
        token.role = isAdmin ? "admin" : "student";
        
        // Persist the user ID from the provider for database synchronization
        token.id = user.id;
      }
      return token;
    },

    /**
     * Session Callback
     * Exposes the user's role and ID to the client-side session.
     * This allows the frontend to conditionally render UI elements based on the role.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect to custom login page if unauthenticated
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this variable is set in Vercel
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };