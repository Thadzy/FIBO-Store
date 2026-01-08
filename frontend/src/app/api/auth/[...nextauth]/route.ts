import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // 1. ด่านตรวจคนเข้าเมือง: เช็คว่าเป็นอีเมล KMUTT หรือไม่?
    async signIn({ user }) {
      if (user.email?.endsWith("@mail.kmutt.ac.th")) {
        return true; // ผ่าน ✅
      } else {
        console.log("Access Denied: Non-KMUTT email");
        return false; // บล็อก ❌
      }
    },

    // 2. ด่านมอบตำแหน่ง: ถ้าเป็น Thadzy ให้เป็น Admin
    async jwt({ token, user }) {
      if (user) {
        // เช็คตรงนี้ครับ! ถ้าอีเมลตรงเป๊ะๆ ให้ถือว่าเป็น admin
        const admins = ["thadchai.suks@mail.kmutt.ac.th"]; 
        
        token.role = admins.includes(user.email!) ? "admin" : "student";
        
        // (แถม) เก็บ User ID จาก Database จริงมาใส่ตรงนี้ได้ในอนาคต
        // token.id = user.id 
      }
      return token;
    },

    // 3. ส่งข้อมูลไปให้ Frontend ใช้
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role; // Frontend จะเห็นว่า role คืออะไร
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // ถ้ายังไม่ login ให้เด้งไปหน้านี้ (เดี๋ยวเราไปสร้าง)
  }
});

export { handler as GET, handler as POST };