export type VitalType = 'bp' | 'heart_rate' | 'weight' | 'glucose' | 'spo2' | 'cholesterol';

export type VitalStatus = 'normal' | 'warning' | 'danger';

export interface VitalMeasurement {
  id: string;
  type: VitalType;
  value: number; // e.g., systolic BP, heart rate bpm, weight kg, glucose mg/dL
  secondaryValue?: number; // e.g., diastolic BP
  unit: string;
  recordedAt: string; // ISO 8601 string
  source: 'manual' | 'bluetooth' | 'device';
  notes?: string;
  status: VitalStatus;
  trend?: 'up' | 'down' | 'stable';
}

export interface RiskFactor {
  id: string;
  name: string;
  category: 'modifiable' | 'non_modifiable';
  present: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface CardiovascularRiskScore {
  score: number; // 0 to 100 percentage or Framingham / QRISK estimate
  category: 'low' | 'moderate' | 'high' | 'very_high';
  calculatedAt: string;
  factorsIdentified: string[];
  keyRecommendations: string[];
  disclaimer: string;
}

export interface BloodReportMetric {
  name: string;
  value: number;
  unit: string;
  normalRange: string;
  status: 'normal' | 'low' | 'high';
}

export interface BloodReport {
  id: string;
  reportDate: string;
  labName?: string;
  metrics: BloodReportMetric[];
  notes?: string;
}

export type TrendPeriod = '1W' | '1M' | '3M' | '6M' | '1Y';
