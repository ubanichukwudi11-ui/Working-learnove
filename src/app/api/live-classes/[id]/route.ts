import { NextRequest, NextResponse } from "next/server";
import {
  applyRoomAction,
  getRoomSnapshot,
  getSignalsSince,
} from "@/lib/liveRoomServer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const sinceSeq = Number(searchParams.get("sinceSeq") || "0");
  const peerId = searchParams.get("peerId") || undefined;

  const snapshot = getRoomSnapshot(id);
  const { signals, latestSeq } = getSignalsSince(id, sinceSeq, peerId);

  return NextResponse.json({
    snapshot,
    signals,
    latestSeq,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const snapshot = applyRoomAction(id, body);
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json({ error: "Failed to process classroom action." }, { status: 400 });
  }
}
