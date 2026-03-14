import { NextRequest, NextResponse } from "next/server";
import { fetchCoinDetail, fetchCoinSwapsData, fetchCoinHoldersData } from "@/lib/zora";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const [coin, swaps, holders] = await Promise.all([
    fetchCoinDetail(address),
    fetchCoinSwapsData(address, 10),
    fetchCoinHoldersData(address, 10),
  ]);

  if (!coin) {
    return NextResponse.json({ error: "Coin not found" }, { status: 404 });
  }

  return NextResponse.json({ coin, swaps, holders });
}
