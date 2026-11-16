import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  SubscriptionServiceError,
  verifyPaystackPaymentAndActivate,
} from "@backend/services/subscriptionService";

/**
 * Server-side Paystack transaction verification.
 * Never trusts client clicks alone; requires PAYSTACK_SECRET_KEY verification against Paystack API.
 */
export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["STUDENT", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await verifyPaystackPaymentAndActivate(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof SubscriptionServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Payment verification failed." },
      { status: 400 }
    );
  }
}
