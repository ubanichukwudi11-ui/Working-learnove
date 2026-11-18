import { Resend } from "resend";

let cachedResendKey = "";
let cachedResend: Resend | null = null;

function getResendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() || "";
}

function getDefaultFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Learnova Academy <noreply@learnova.ng>"
  );
}

function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()?.replace(/\/+$/, "");

  if (configured) {
    try {
      const parsed = new URL(configured);
      const isLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
        parsed.hostname.toLowerCase()
      );
      if (!isLocal || !railwayDomain) {
        return parsed.origin;
      }
    } catch {
      // Fall through to RAILWAY_PUBLIC_DOMAIN
    }
  }

  if (railwayDomain) {
    return `https://${railwayDomain}`;
  }

  return "http://localhost:3000";
}

function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;
  if (!cachedResend || cachedResendKey !== apiKey) {
    cachedResendKey = apiKey;
    cachedResend = new Resend(apiKey);
  }
  return cachedResend;
}

export interface EmailSendResult {
  sent: boolean;
  id?: string;
  skippedReason?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLearnovaEmailHtml(title: string, bodyHtml: string): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px;background-color:#F5F4FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0B1230;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E4E1F5;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#070D24 0%,#1A1B4B 100%);padding:24px 28px;color:#FFFFFF;">
        <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#22D3EE;">LEARNOVA DIGITAL ACADEMY</div>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:800;line-height:1.3;">${escapeHtml(title)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;font-size:14px;line-height:1.65;color:#282D4F;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#FAF8FF;border-top:1px solid #E4E1F5;font-size:12px;color:#6B6F94;">
        Learnova Nigeria · WAEC, NECO, JAMB &amp; Secondary Digital Campus · <a href="${appUrl}" style="color:#4F46E5;text-decoration:none;">Open Learnova</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  const to = params.to.trim();
  if (!to) {
    return { sent: false, skippedReason: "Missing recipient email." };
  }

  const client = getResendClient();
  if (!client) {
    console.info(`[Email skipped — RESEND_API_KEY not configured] To: ${to} | Subject: ${params.subject}`);
    return { sent: false, skippedReason: "RESEND_API_KEY is not configured." };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getDefaultFromEmail(),
      to: [to],
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.warn("Resend email delivery warning:", error.message);
      return { sent: false, skippedReason: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || "Email transport failed";
    console.warn("Transactional email send error:", msg);
    return { sent: false, skippedReason: msg };
  }
}

export async function sendWelcomeEmail(input: {
  to: string;
  fullName: string;
  role: string;
}) {
  const roleLabel =
    input.role === "TEACHER"
      ? "Educator (Application Pending Review)"
      : input.role === "PARENT"
      ? "Parent / Guardian"
      : "Student";

  const html = wrapLearnovaEmailHtml(
    `Welcome to Learnova, ${input.fullName}`,
    `<p>Hello <strong>${escapeHtml(input.fullName)}</strong>,</p>
     <p>Your Learnova account has been created as <strong>${escapeHtml(roleLabel)}</strong>.</p>
     ${
       input.role === "TEACHER"
         ? `<p>Our School Admin team is reviewing your subject qualifications and teaching credentials. You will receive an email as soon as your subjects are approved for live classes.</p>`
         : input.role === "PARENT"
         ? `<p>To view your child's attendance, quiz analytics, and PDF report cards, open the Parent Portal and enter your child's Learnova email to send a consent verification code.</p>`
         : `<p>Confirm your class level (JSS1–SS3) and subjects in your workspace to access scheduled live classes, topic video lessons, and Nova AI tutoring.</p>`
     }
     <p style="margin-top:20px;">
       <a href="${getAppUrl()}/login" style="display:inline-block;padding:11px 22px;background:#4F46E5;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;">Open Your Workspace</a>
     </p>`
  );

  return dispatchEmail({
    to: input.to,
    subject: `Welcome to Learnova Digital Academy`,
    html,
  });
}

export async function sendVerificationLinkEmail(input: {
  to: string;
  fullName: string;
  actionLink: string;
}) {
  const html = wrapLearnovaEmailHtml(
    "Verify Your Learnova Email Address",
    `<p>Hello <strong>${escapeHtml(input.fullName)}</strong>,</p>
     <p>Click the button below to confirm your email address and activate full access to your Learnova account:</p>
     <p style="margin:22px 0;">
       <a href="${escapeHtml(input.actionLink)}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;">Confirm Email Address</a>
     </p>
     <p style="font-size:12px;color:#6B6F94;">If you did not request this email, you can safely ignore it.</p>`
  );

  return dispatchEmail({
    to: input.to,
    subject: "Verify your Learnova email address",
    html,
  });
}

export async function sendTeacherApplicationStatusEmail(input: {
  to: string;
  teacherName: string;
  subjectName: string;
  decision: string;
  explanation?: string;
}) {
  const friendlyDecision = input.decision.replace(/_/g, " ");
  const html = wrapLearnovaEmailHtml(
    `Teacher Application Update: ${input.subjectName}`,
    `<p>Hello <strong>${escapeHtml(input.teacherName)}</strong>,</p>
     <p>Your application to teach <strong>${escapeHtml(input.subjectName)}</strong> has been updated to: <strong>${escapeHtml(friendlyDecision)}</strong>.</p>
     ${
       input.explanation
         ? `<div style="margin:16px 0;padding:14px;border-radius:10px;background:#F5F3FF;border:1px solid #DCD7F5;"><strong>Reviewer Notes:</strong><br/>${escapeHtml(input.explanation)}</div>`
         : ""
     }
     <p style="margin-top:20px;">
       <a href="${getAppUrl()}/teacher/applications" style="display:inline-block;padding:11px 22px;background:#4F46E5;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;">View Application Status</a>
     </p>`
  );

  return dispatchEmail({
    to: input.to,
    subject: `Learnova Teacher Application — ${friendlyDecision}`,
    html,
  });
}

export async function sendParentWardVerificationEmail(input: {
  toStudent: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  relationship: string;
  verificationCode: string;
}) {
  const html = wrapLearnovaEmailHtml(
    "Guardian Link Verification Code",
    `<p>Hello <strong>${escapeHtml(input.studentName)}</strong>,</p>
     <p><strong>${escapeHtml(input.parentName)}</strong> (${escapeHtml(input.parentEmail)}, ${escapeHtml(input.relationship)}) requested to link their Learnova Parent Portal to your student account.</p>
     <p>If you recognize this parent/guardian, share the 6-digit verification code below or approve the request inside your <strong>Learnova Profile</strong> page:</p>
     <div style="margin:20px 0;padding:16px;text-align:center;border-radius:12px;background:#070D24;color:#22D3EE;font-size:28px;font-weight:800;letter-spacing:0.22em;font-family:monospace;">
       ${escapeHtml(input.verificationCode)}
     </div>
     <p style="font-size:12px;color:#6B6F94;">If you did not expect this request, open your Profile page to reject it immediately.</p>`
  );

  return dispatchEmail({
    to: input.toStudent,
    subject: `Learnova Parent Link Verification Code: ${input.verificationCode}`,
    html,
  });
}

export async function sendParentWardLinkedConfirmationEmail(input: {
  toParent: string;
  parentName: string;
  studentName: string;
  relationship: string;
}) {
  const html = wrapLearnovaEmailHtml(
    `Ward Link Verified: ${input.studentName}`,
    `<p>Hello <strong>${escapeHtml(input.parentName)}</strong>,</p>
     <p>Your guardian link to <strong>${escapeHtml(input.studentName)}</strong> (${escapeHtml(input.relationship)}) is now <strong>VERIFIED</strong>.</p>
     <p>You can now view attendance, quiz scores, fee receipts, and official PDF report cards in your Parent Portal.</p>
     <p style="margin-top:20px;">
       <a href="${getAppUrl()}/parent" style="display:inline-block;padding:11px 22px;background:#4F46E5;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;">Open Parent Portal</a>
     </p>`
  );

  return dispatchEmail({
    to: input.toParent,
    subject: `Learnova Ward Link Verified — ${input.studentName}`,
    html,
  });
}

export async function sendPaystackReceiptEmail(input: {
  to: string;
  studentName: string;
  planName: string;
  amountNgn: number;
  reference: string;
  expiresAtIso: string;
}) {
  const expiresLabel = new Date(input.expiresAtIso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const html = wrapLearnovaEmailHtml(
    "Learnova Payment Receipt & Subscription Active",
    `<p>Hello <strong>${escapeHtml(input.studentName)}</strong>,</p>
     <p>Thank you! Your Paystack payment has been verified and your Learnova learning access is now active.</p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="margin:16px 0;background:#FAF8FF;border:1px solid #E4E1F5;border-radius:10px;font-size:13px;">
       <tr><td><strong>Plan</strong></td><td align="right">${escapeHtml(input.planName)}</td></tr>
       <tr><td><strong>Amount Paid</strong></td><td align="right">₦${Number(input.amountNgn).toLocaleString()}</td></tr>
       <tr><td><strong>Reference</strong></td><td align="right" style="font-family:monospace;">${escapeHtml(input.reference)}</td></tr>
       <tr><td><strong>Valid Until</strong></td><td align="right">${escapeHtml(expiresLabel)}</td></tr>
     </table>
     <p style="margin-top:20px;">
       <a href="${getAppUrl()}/subscriptions" style="display:inline-block;padding:11px 22px;background:#4F46E5;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;">View Subscription &amp; Classes</a>
     </p>`
  );

  return dispatchEmail({
    to: input.to,
    subject: `Payment Receipt — ${input.planName} (₦${Number(input.amountNgn).toLocaleString()})`,
    html,
  });
}
