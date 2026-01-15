import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email?.endsWith("@mail.kmutt.ac.th")) {
        return true;
      }
      return false;
    },

    async jwt({ token, user }) {
      if (user && user.email) {
        // --- DEBUGGING START ---
        const envAdmins = process.env.ADMIN_EMAILS || "";
        const adminList = envAdmins.split(",").map(e => e.trim().toLowerCase());
        const userEmail = user.email.toLowerCase();
        const isAdmin = adminList.includes(userEmail);

        console.log("---------------------------------------");
        console.log("DEBUG AUTH LOG:");
        console.log("1. Environment Variable Raw:", envAdmins);
        console.log("2. Parsed Admin List:", adminList);
        console.log("3. User Email:", userEmail);
        console.log("4. Is Admin?", isAdmin);
        console.log("---------------------------------------");
        // --- DEBUGGING END ---

        token.role = isAdmin ? "admin" : "student";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };