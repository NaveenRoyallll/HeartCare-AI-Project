export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'thrice_daily' | 'as_needed' | 'weekly';

export type MedicationTiming = 'before_food' | 'after_food' | 'with_food' | 'empty_stomach' | 'bedtime';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string; // e.g. "50mg", "1 tablet"
  frequency: MedicationFrequency;
  times: string[]; // e.g. ["08:00", "20:00"]
  timing: MedicationTiming;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  prescribedBy?: string;
  instructions?: string;
  remainingPills?: number;
  totalPills?: number;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'taken' | 'skipped' | 'missed';
  notes?: string;
}
