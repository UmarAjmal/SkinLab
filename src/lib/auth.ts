import { NextAuthOptions, getServerSession as getNextAuthServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Ensure NEXTAUTH_URL never points to stale onrender.com
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("onrender.com")) {
  if (process.env.VERCEL_URL || process.env.NODE_ENV === "production") {
    process.env.NEXTAUTH_URL = "https://skinlabb.vercel.app";
  }
}

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
          const user = (await (prisma.user as any).findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
              company: true,
            },
          })) as any;

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
            full_name: user.full_name || "",
            role: user.role?.name || "User",
            role_id: user.role_id,
            company_id: user.company_id || user.company?.id || null,
            company_name: user.company?.name || "Skin-Lab Clinic",
            is_first_login: user.is_first_login ?? false,
            permissions: (user.role?.permissions || []).map((p: any) => ({
              module: p.module,
              can_read: p.can_read,
              can_write: p.can_write,
              can_delete: p.can_delete,
            })),
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
    async redirect({ url, baseUrl }) {
      // Prevent any redirects to onrender.com
      if (url.includes("onrender.com") || baseUrl.includes("onrender.com")) {
        return "/login";
      }
      if (url.startsWith("/")) return url;
      try {
        const origin = new URL(url).origin;
        if (origin === baseUrl || origin.includes("vercel.app") || origin.includes("localhost")) {
          return url;
        }
      } catch {
        // ignore
      }
      return "/login";
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.role_id = (user as any).role_id;
        token.full_name = (user as any).full_name;
        token.company_id = (user as any).company_id;
        token.company_name = (user as any).company_name;
        token.is_first_login = (user as any).is_first_login;
        token.permissions = (user as any).permissions;
      }
      if (trigger === "update" && session) {
        if (session.is_first_login !== undefined) token.is_first_login = session.is_first_login;
        if (session.company_name) token.company_name = session.company_name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).role_id = token.role_id;
        (session.user as any).full_name = token.full_name;
        (session.user as any).company_id = token.company_id;
        (session.user as any).company_name = token.company_name;
        (session.user as any).is_first_login = token.is_first_login;
        (session.user as any).permissions = token.permissions || [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
};

export function getServerSession() {
  return getNextAuthServerSession(authOptions);
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const userRole = (session.user as any).role;
  if (userRole === "Admin" || allowedRoles.includes(userRole)) {
    return session;
  }
  throw new Error("Unauthorized");
}

