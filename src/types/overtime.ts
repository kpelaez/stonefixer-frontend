export type OvertimeType = "credit" | "debit";
export type OvertimeStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface OvertimeEntryRead {
  id: number;
  user_id: number;
  user_full_name: string;
  entry_type: OvertimeType;
  hours: number;
  reference_date: string;
  reason: string;
  status: OvertimeStatus;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by_full_name: string | null;
  created_at: string;
}

export interface OvertimeBalanceRead {
  user_id: number;
  user_full_name: string;
  total_credit_hours: number;
  total_debit_hours: number;
  balance_hours: number;
  pending_credit_hours: number;
  pending_debit_hours: number;
}

export interface OvertimeEntryCreate {
  user_id: number;
  entry_type: OvertimeType;
  hours: number;
  reference_date: string;
  reason: string;
}

export interface OvertimeEntryReview {
  status: "approved" | "rejected";
  review_note?: string;
}