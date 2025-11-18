import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  const pathname = req.nextUrl.pathname;

  const isProtected =
    pathname.startsWith("/landing-page") ||
    pathname.startsWith("/booking");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// IMPORTANT: matcher required in Next.js 16+
export const config = {
  matcher: ["/landing-page/:path*", "/booking/:path*"],
};
