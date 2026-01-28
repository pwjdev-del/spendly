import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id?: string
            organizationId?: string | null
            role?: string
            canReconcile?: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role?: string
        organizationId?: string | null
        canReconcile?: boolean
        avatarUrl?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        role?: string
        organizationId?: string | null
        canReconcile?: boolean
    }
}
