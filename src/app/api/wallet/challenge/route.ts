import { NextRequest, NextResponse } from "next/server";
import {
  buildWalletConnectCommand,
  generateChallenge,
} from "@/lib/wallet-auth";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const challenge = generateChallenge();

  return NextResponse.json(
    {
      ...challenge,
      command: buildWalletConnectCommand(origin, challenge.nonce),
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}
