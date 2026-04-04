import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge Middleware — Auth Guard
 * Runs BEFORE any page renders.
 * Protected routes redirect to /login if no session.
 *
 * In production, this would verify the Supabase JWT.
 * For demo mode, all routes are accessible.
 */

const protectedRoutes = ["/dashboard", "/repo", "/settings"];
const publicRoutes = ["/", "/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // In production: verify Supabase session cookie
  // const session = request.cookies.get("sb-access-token")?.value;
  // if (!session) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // Demo mode: allow all
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
