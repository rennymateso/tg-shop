import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api/admin-login");
  const isLogoutRoute = pathname.startsWith("/api/admin-logout");

  if (!isAdminRoute && !isApiRoute && !isLogoutRoute) {
    return NextResponse.next();
  }

  if (isApiRoute || isLogoutRoute) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(ADMIN_COOKIE)?.value;

  if (isLoginPage) {
    if (authCookie === "ok") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (authCookie !== "ok") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin-login", "/api/admin-logout"],
};