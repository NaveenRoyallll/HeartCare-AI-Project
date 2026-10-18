import { VitalMeasurement, VitalsSummary } from "./vitals";
import { RiskAssessment } from "./risk";
import { CardiovascularAssessment } from "./assessment";

export interface PatientDemographics {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  accessGranted: boolean;
  accessGrantedAt?: string;
  primaryPhysicianId: string;
  primaryPhysicianName: string;
  lastVisitDate?: string;
  status: "active" | "monitored" | "critical" | "discharged";
}

export interface MedicalCondition {
  id: string;
  name: string;
  icd10Code?: string;
  diagnosedDate: string;
  status: "active" | "resolved" | "managed";
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  adherencePercentage: number;
  missedDosesLast30Days: number;
  status: "active" | "paused" | "discontinued";
  instructions?: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  testName: string;
  category: "Lipid Panel" | "Cardiac Biomarkers" | "Metabolic" | "CBC" | "Renal";
  collectedAt: string;
  reportedAt: string;
  sourceLab: string;
  results: {
    parameter: string;
    value: number | string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }[];
  aiSummary?: {
    summaryText: string;
    confidenceScore: number;
    generatedAt: string;
    modelName: string;
    isAiGenerated: true;
  };
  clinicianReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  clinicalNotes?: string;
}

export interface ECGRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  sourceDevice: string; // e.g. "AliveCor KardiaMobile 6L"
  leads: number;
  heartRateBpm: number;
  prIntervalMs: number;
  qrsDurationMs: number;
  qtcIntervalMs: number;
  rhythmInterpretation: string;
  aiClassification: {
    condition: string;
    confidenceScore: number;
    isAiGenerated: true;
    generatedAt: string;
  };
  clinicianReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  doctorNotes?: string;
  waveformSample?: number[]; // Mini sample for preview
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  createdAt: string;
  title: string;
  content: string;
  category: "Progress Note" | "Consultation" | "Review" | "Discharge Summary";
  signed: boolean;
}

export interface AlertItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  type: "critical" | "warning" | "info";
  category: "vitals" | "ecg" | "medication" | "risk_elevation";
  title: string;
  description: string;
  timestamp: string;
  source: string;
  value?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired?: string;
}

export interface ReviewItem {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  type: "ecg" | "lab" | "risk" | "vitals";
  title: string;
  summary: string;
  submittedAt: string;
  urgency: "urgent" | "normal" | "low";
  isAiGenerated: boolean;
  source: string;
  targetId: string; // ID of the ECG, Lab, or Risk record
}

export interface PatientDetail {
  demographics: PatientDemographics;
  conditions: MedicalCondition[];
  allergies: string[];
  medications: Medication[];
  currentRisk: RiskAssessment | null;
  riskHistory: RiskAssessment[];
  recentVitals: VitalMeasurement[];
  vitalsSummary: VitalsSummary;
  labs: LabReport[];
  ecgs: ECGRecord[];
  notes: ClinicalNote[];
  activeAlerts: AlertItem[];
  assessments: CardiovascularAssessment[];
  assessmentSourceMeasurements: VitalMeasurement[];
}
