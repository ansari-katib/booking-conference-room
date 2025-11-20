import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  role?: string;
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  const pathname = req.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/landing-page") || pathname.startsWith("/booking");
  const isAdminRoute = pathname.startsWith("/admin");

  if ((isProtected || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (token && isAdminRoute) {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.role !== "admin") {
        return NextResponse.redirect(new URL("/landing-page", req.url));
      }
    } catch (_err) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

// IMPORTANT: matcher required in Next.js 16+
export const config = {
  matcher: ["/landing-page/:path*", "/booking/:path*", "/admin/:path*"],
};
