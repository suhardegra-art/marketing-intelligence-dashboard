import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const expectedEmail = process.env.DASHBOARD_EMAIL;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!expectedEmail || !expectedPassword || !secret) {
    return NextResponse.json({ message: "Dashboard login is not configured yet." }, { status: 500 });
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("mi_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
