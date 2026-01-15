import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = [
  "thadchai.suks@mail.kmutt.ac.th", 
  // Add other admins here if needed
];

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // 1. Check KMUTT Email
    async signIn({ user }) {
      if (user.email?.endsWith("@mail.kmutt.ac.th")) {
        return true; 
      }
      console.log("Access Denied: Non-KMUTT email");
      return false; 
    },

    // 2. Assign Role
    async jwt({ token, user }) {
      if (user && user.email) {
        // Force lowercase comparison to avoid case-sensitivity issues
        const userEmail = user.email.toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail);

        console.log(`Checking Admin: ${userEmail} -> ${isAdmin ? "YES" : "NO"}`);
        
        token.role = isAdmin ? "admin" : "student";
        token.id = user.id;
      }
      return token;
    },

    // 3. Pass to Frontend
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };