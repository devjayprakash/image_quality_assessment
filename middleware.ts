import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Skip authentication for the login page and auth API
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/api/admin/auth"
  ) {
    return NextResponse.next();
  }

  // Protect all admin routes (both pages and API)
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin")
  ) {
    // For API routes, check Authorization header
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      const authHeader = request.headers.get("authorization");
      
      if (!authHeader) {
        return new NextResponse("Authentication required", { status: 401 });
      }

      const [type, credentials] = authHeader.split(" ");
      if (type !== "Basic") {
        return new NextResponse("Invalid authentication type", { status: 401 });
      }

      const [email, password] = Buffer.from(credentials, "base64")
        .toString()
        .split(":");

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
        return new NextResponse("Invalid credentials", { status: 401 });
      }
    } else {
      // For page routes, redirect to login if no auth cookie
      const authCookie = request.cookies.get("adminAuth");
      if (!authCookie) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}; 