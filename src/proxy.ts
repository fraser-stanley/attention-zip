import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, createStagingAuthToken } from "@/lib/staging-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};
const PUBLIC_FILE_PATH = /\.[^/]+$/;

async function checkAuth(request: NextRequest): Promise<NextResponse | null> {
  const password = process.env.STAGING_PASSWORD;
  if (!password) return null;

  const path = request.nextUrl.pathname;

  if (path === "/login") return null;
  if (path === "/api/staging-auth") return null;

  // Agent-facing endpoints are public
  if (path === "/api" || path.startsWith("/api/")) return null;
  if (path.endsWith("/skill-md")) return null;
  if (path.startsWith("/.well-known/")) return null;
  if (PUBLIC_FILE_PATH.test(path)) return null;

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const authToken = await createStagingAuthToken(password);
  if (cookie === authToken) return null;

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const authResponse = await checkAuth(request);
  if (authResponse) return authResponse;

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    Object.entries(CORS_HEADERS).forEach(([name, value]) => {
      response.headers.set(name, value);
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
