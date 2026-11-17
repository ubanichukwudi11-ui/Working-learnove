import { NextRequest, NextResponse } from "next/server";
import {
  handlePaystackWebhookEvent,
  SubscriptionServiceError,
} from "@backend/services/subscriptionService";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const result = await handlePaystackWebhookEvent(rawBody, signature);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof SubscriptionServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Paystack webhook error:", err);
    return NextResponse.json(
      { error: "Failed to process Paystack webhook." },
      { status: 400 }
    );
  }
}
