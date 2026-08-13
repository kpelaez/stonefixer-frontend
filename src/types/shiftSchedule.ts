
export type ShiftType = 'early' | 'regular';
export type ShiftStatus = 'confirmed' | 'cancelled';

export interface ShiftSchedule {
  id: number;
  user_id: number;
  department: string;
  date: string; // ISO format: "2026-01-12"
  shift_type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
  
  // Información extendida del usuario
  user_full_name?: string;
  user_email?: string;
  modified_by_user_id?: number;
  modified_by_full_name?: string;
}

export interface ShiftScheduleCreate {
  date: string; // ISO format
  shift_type: ShiftType;
  notes?: string;
  target_user_id?: number;
}

export interface ShiftScheduleUpdate {
  date?: string;
  shift_type?: ShiftType;
  status?: ShiftStatus;
  notes?: string;
}

export interface ShiftScheduleStats {
  user_id: number;
  user_full_name: string;
  total_shifts: number;
  early_shifts: number;
  regular_shifts: number;
  percentage_of_total: number;
}

export interface ShiftAlert {
  date: string;
  shift_type: string;
  days_until: number;
  severity: 'high' | 'medium';
  message: string;
}

export interface ShiftAlertsResponse {
  alerts: ShiftAlert[];
  count: number;
}

export interface TeamMember {
  id: number;
  full_name: string;
}