import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, resolvePublicAppOrigin } from "@backend/services/serverAuth";
import {
  initializePaystackCheckout,
  SubscriptionServiceError,
} from "@backend/services/subscriptionService";

const initSchema = z.object({
  planId: z.string().min(1),
  classLevelId: z.string().min(1),
  subjectIds: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, ["STUDENT", "ADMIN", "SUPER_ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const raw = await req.json();
    const parsed = initSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Select a valid subscription plan and class level." },
        { status: 400 }
      );
    }

    const requestOrigin = resolvePublicAppOrigin(req);

    const result = await initializePaystackCheckout(auth.user, {
      ...parsed.data,
      callbackUrl: `${requestOrigin}/subscriptions`,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof SubscriptionServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg =
      err instanceof Error ? err.message : "Failed to initialize Paystack checkout.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
