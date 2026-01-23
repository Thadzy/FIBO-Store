import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * List of authorized administrator email addresses.
 * This constant serves as the source of truth for Role-Based Access Control (RBAC).
 * Users with emails in this list will be granted the 'admin' role upon sign-in.
 */
const ADMIN_EMAILS = [
  "thadchai.suks@mail.kmutt.ac.th", 
  "pirakran.you01@mail.kmutt.ac.th"
  // Future admin emails should be appended here
];

/**
 * NextAuth Configuration Options
 * Configures the authentication providers, session strategy, and callback hooks
 * for managing user access and roles within the application.
 */
const authOptions: NextAuthOptions = {
  providers: [
    /**
     * Google OAuth Provider
     * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * SignIn Callback
     * Validates whether the user is allowed to sign in.
     * Enforces a strict domain restriction to ensure only KMUTT organizational
     * accounts (@mail.kmutt.ac.th) can access the system.
     * * @param user - The user object returned by the provider.
     * @returns boolean - True if sign-in is allowed, false otherwise.
     */
    async signIn({ user }) {
      if (user.email?.endsWith("@mail.kmutt.ac.th")) {
        return true; 
      }
      console.log("Access Denied: Non-KMUTT email attempted login.");
      return false; 
    },

    /**
     * JWT Callback
     * This callback is called whenever a JSON Web Token is created (i.e., at sign-in)
     * or updated. It is the ideal place to persist user roles to the token.
     * * Logic:
     * 1. Normalizes the email to lowercase to prevent case-sensitivity mismatches.
     * 2. Checks if the normalized email exists in the ADMIN_EMAILS list.
     * 3. Assigns 'admin' or 'student' role to the token payload.
     */
    async jwt({ token, user }) {
      if (user && user.email) {
        // Force lowercase comparison for consistent validation
        const userEmail = user.email.toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail);

        // Logging for audit trail purposes
        console.log(`[Auth] Role Assignment: ${userEmail} -> ${isAdmin ? "ADMIN" : "STUDENT"}`);
        
        token.role = isAdmin ? "admin" : "student";
        token.id = user.id;
      }
      return token;
    },

    /**
     * Session Callback
     * Called whenever the client checks the session (e.g., useSession()).
     * This step exposes the role and user ID (stored in the JWT) to the client-side
     * session object, allowing the UI to render conditionally based on permissions.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: { 
    strategy: "jwt" 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Export the NextAuth handler for both GET and POST requests.
 * This standardizes the API route entry point for authentication flows.
 */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };