export interface AssessmentObservation {
  name: string;
  value?: unknown;
  unit?: string;
  source?: string;
  measured_at?: string;
  source_page?: number;
  confidence?: number;
}

export interface CardiovascularAssessment {
  id: string;
  user_id: string;
  assessment_kind: "acute_triage" | "longitudinal_risk" | string;
  classification: string;
  observations_considered: AssessmentObservation[];
  input_snapshot: Record<string, unknown>;
  data_quality: string;
  missing_inputs: string[];
  uncertainty: string[];
  recommendations: string[];
  emergency_guidance: string[];
  created_at: string;
}
