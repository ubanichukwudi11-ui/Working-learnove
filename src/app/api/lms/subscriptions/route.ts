import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@backend/services/serverAuth";
import {
  getSubscriptionsOverview,
  handleSubscriptionMutation,
  SubscriptionServiceError,
} from "@backend/services/subscriptionService";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const overview = await getSubscriptionsOverview(auth.user);
  return NextResponse.json(overview);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const result = await handleSubscriptionMutation(auth.user, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof SubscriptionServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errMsg = (err as { message?: string })?.message;
    return NextResponse.json(
      { error: errMsg || "Failed to process subscription request." },
      { status: 400 }
    );
  }
}
