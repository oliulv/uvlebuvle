import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, COOKIE_VALUE } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get(COOKIE_NAME);

  if (authCookie?.value !== COOKIE_VALUE) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/games", "/games/:path*"],
};
