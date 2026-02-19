import type { NextAuthConfig } from "next-auth";

const protectedRoutes = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/analytics",
  "/budgets",
  "/goals",
  "/insights",
  "/import",
  "/settings",
  "/categories",
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = protectedRoutes.some((r) => nextUrl.pathname.startsWith(r));
      const isOnAuth = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
