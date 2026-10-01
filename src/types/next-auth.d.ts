import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      role_id?: string;
      permissions?: Array<{
        module: string;
        can_read: boolean;
        can_write: boolean;
        can_delete: boolean;
      }>;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    role_id?: string;
    permissions?: Array<{
      module: string;
      can_read: boolean;
      can_write: boolean;
      can_delete: boolean;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    role_id?: string;
    permissions?: Array<{
      module: string;
      can_read: boolean;
      can_write: boolean;
      can_delete: boolean;
    }>;
  }
}
