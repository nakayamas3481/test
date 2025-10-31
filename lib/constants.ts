export const USER_ROLES = ["EMPLOYEE", "APPROVER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EXPENSE_STATUSES = [
  "DRAFT",
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const APPROVAL_STATUSES = [
  "PENDING",
  "WAITING",
  "APPROVED",
  "REJECTED",
  "SKIPPED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
