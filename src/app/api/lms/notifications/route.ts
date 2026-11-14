import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/serverAuth";
import { loadLmsState, mutateLmsState } from "@/lib/lmsDb";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const state = await loadLmsState();
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  const items = state.notifications.filter(
    (n) =>
      n.recipientUserId === auth.user.id ||
      (isAdmin && n.recipientUserId === "ALL_ADMINS")
  );

  return NextResponse.json({
    notifications: items.slice(0, 40),
    unreadCount: items.filter((n) => !n.isRead).length,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const action = String(body.action || "");
  const isAdmin = auth.user.role === "ADMIN" || auth.user.role === "SUPER_ADMIN";

  const updated = await mutateLmsState((state) => {
    if (action === "MARK_ALL_READ") {
      state.notifications.forEach((n) => {
        if (
          n.recipientUserId === auth.user.id ||
          (isAdmin && n.recipientUserId === "ALL_ADMINS")
        ) {
          n.isRead = true;
        }
      });
    } else if (action === "MARK_READ" && body.notificationId) {
      const target = state.notifications.find(
        (n) =>
          n.id === String(body.notificationId) &&
          (n.recipientUserId === auth.user.id ||
            (isAdmin && n.recipientUserId === "ALL_ADMINS"))
      );
      if (target) target.isRead = true;
    }
    return state.notifications.filter(
      (n) =>
        n.recipientUserId === auth.user.id ||
        (isAdmin && n.recipientUserId === "ALL_ADMINS")
    );
  });

  return NextResponse.json({
    notifications: updated.slice(0, 40),
    unreadCount: updated.filter((n) => !n.isRead).length,
  });
}
