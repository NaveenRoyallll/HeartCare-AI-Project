export type VitalType =
  | "heart_rate"
  | "blood_pressure"
  | "spo2"
  | "respiratory_rate"
  | "blood_glucose"
  | "temperature"
  | "weight";

export type MeasurementSource =
  | "Hospital Monitor"
  | "Omron Smart Cuff"
  | "Apple Watch Series 9"
  | "Fitbit Sense"
  | "Dexcom G7 CGM"
  | "Patient Manual Entry"
  | "Clinical Visit";

export interface VitalMeasurement {
  id: string;
  patientId: string;
  type: VitalType;
  value: number; // For single value or systolic
  secondaryValue?: number; // For diastolic
  unit: string;
  timestamp: string; // ISO 8601
  source: MeasurementSource;
  isAbnormal?: boolean;
  notes?: string;
}

export interface VitalThreshold {
  minNormal: number;
  maxNormal: number;
  minWarning: number;
  maxWarning: number;
  unit: string;
}

export interface VitalsSummary {
  lastHeartRate?: VitalMeasurement;
  lastBloodPressure?: VitalMeasurement;
  lastSpO2?: VitalMeasurement;
  lastRespiratoryRate?: VitalMeasurement;
  lastGlucose?: VitalMeasurement;
  lastWeight?: VitalMeasurement;
}

export interface VitalChartPoint {
  timestamp: string;
  formattedTime: string;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
  respiratoryRate?: number;
  source?: string;
}
