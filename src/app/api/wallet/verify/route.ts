import { NextRequest, NextResponse } from "next/server";
import { WalletAuthError, verifyConnectToken } from "@/lib/wallet-auth";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: "invalid_request",
        error: "Request body must be valid JSON.",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const token =
    typeof body === "object" && body !== null && "token" in body
      ? (body as { token?: unknown }).token
      : undefined;

  if (typeof token !== "string") {
    return NextResponse.json(
      {
        code: "invalid_request",
        error: "Request body must include a token string.",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  try {
    const session = await verifyConnectToken(token, request.nextUrl.origin);

    return NextResponse.json(
      {
        address: session.address,
        session,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    if (error instanceof WalletAuthError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.message,
        },
        {
          status: error.status,
          headers: NO_STORE_HEADERS,
        },
      );
    }

    return NextResponse.json(
      {
        code: "internal_error",
        error: "Wallet verification failed.",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
