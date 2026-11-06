import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { DefaultSession } from "next-auth";

const adminUsername = process.env.ADMIN_GITHUB_USERNAME?.trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ profile }) {
      return (
        typeof profile?.login === "string" &&
        !!adminUsername &&
        profile.login.toLowerCase() === adminUsername
      );
    },
    async jwt({ token, profile }) {
      if (typeof profile?.login === "string") token.githubLogin = profile.login;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.githubLogin === "string") {
        session.user.githubLogin = token.githubLogin;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { githubLogin?: string };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    githubLogin?: string;
  }
}
