import { NextResponse } from "next/server";
import { isValidPasscode, COOKIE_NAME, COOKIE_VALUE } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { passcode } = body;

  if (!isValidPasscode(passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30, // 30 minutes
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(COOKIE_NAME);

  return response;
}
