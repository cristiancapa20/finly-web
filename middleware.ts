import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/help",
  "/forgot-password",
  "/reset-password",
];

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const { pathname } = req.nextUrl;

      // Allow public paths
      if (publicPaths.some((p) => pathname === p)) {
        return true;
      }

      // Allow static files & API auth
      if (
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.match(/\.(png|jpg|svg|json|txt|xml|js|ico)$/)
      ) {
        return true;
      }

      // Everything else requires auth
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
