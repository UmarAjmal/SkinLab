import { NextAuthOptions, getServerSession as getNextAuthServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "skinlab-super-secret-production-key-987654321",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = credentials.email.trim().toLowerCase();
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
            include: { role: true },
          });

          if (!user || !user.password) {
            console.warn(`[Auth] User not found: ${email}`);
            return null;
          }
          if (!user.is_active) {
            console.warn(`[Auth] Inactive user login attempt: ${email}`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            console.warn(`[Auth] Invalid password for: ${email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role?.name || "User",
          };
        } catch (error) {
          console.error("[Auth Exception in authorize]:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export function getServerSession() {
  return getNextAuthServerSession(authOptions);
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession();
  if (!session || !allowedRoles.includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
