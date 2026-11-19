export type NormalizedApplicationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "RESUBMISSION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

const STATUS_ALIASES: Record<string, NormalizedApplicationStatus> = {
  draft: "DRAFT",
  pending: "PENDING_REVIEW",
  pending_approval: "PENDING_REVIEW",
  pending_review: "PENDING_REVIEW",
  under_review: "UNDER_REVIEW",
  additional_information_required: "RESUBMISSION_REQUIRED",
  additional_info_required: "RESUBMISSION_REQUIRED",
  resubmission_required: "RESUBMISSION_REQUIRED",
  approved: "APPROVED",
  active: "APPROVED",
  rejected: "REJECTED",
  suspended: "SUSPENDED",
};

export function normalizeTeacherApplicationStatus(
  raw: string
): NormalizedApplicationStatus | null {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return STATUS_ALIASES[key] || null;
}

export function formatApplicationStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING_REVIEW":
      return "Pending Approval";
    case "UNDER_REVIEW":
      return "Under Review";
    case "RESUBMISSION_REQUIRED":
      return "Additional Info Required";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    case "ACTIVE":
      return "Approved";
    case "PENDING":
      return "Pending Approval";
    default:
      return String(status || "").replace(/_/g, " ");
  }
}

export function getStatusTextColor(status: string): string {
  switch (status) {
    case "APPROVED":
    case "ACTIVE":
      return "text-emerald-700 dark:text-emerald-300";
    case "UNDER_REVIEW":
      return "text-indigo-700 dark:text-indigo-300";
    case "PENDING_REVIEW":
    case "PENDING":
    case "RESUBMISSION_REQUIRED":
      return "text-amber-700 dark:text-amber-300";
    case "DRAFT":
      return "text-[var(--foreground-subtle)]";
    default:
      return "text-rose-700 dark:text-rose-300";
  }
}
