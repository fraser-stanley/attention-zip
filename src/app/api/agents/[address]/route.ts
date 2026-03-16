import { NextRequest, NextResponse } from "next/server";
import { getAgentProfileData } from "@/lib/data";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=120";

function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!isValidAddress(address)) {
    return NextResponse.json(
      { error: "Invalid address. Expected 0x-prefixed 40-character hex string." },
      { status: 400 }
    );
  }

  const data = await getAgentProfileData(address);

  return NextResponse.json(data, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
