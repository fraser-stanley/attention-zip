import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createStagingAuthToken,
  sanitizeNextPath,
} from "@/lib/staging-auth";

export async function POST(request: NextRequest) {
  const password = process.env.STAGING_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string; next?: string }
    | null;

  if (body?.password !== password) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const next = sanitizeNextPath(body?.next);
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(AUTH_COOKIE, await createStagingAuthToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
