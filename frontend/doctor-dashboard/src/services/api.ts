import {
  AuthResponse,
  LoginCredentials,
  Doctor,
  DoctorProfileUpdate,
  PatientDemographics,
  PatientDetail,
  ClinicalNote,
  AlertItem,
  ReviewItem,
  VitalMeasurement,
  CardiovascularAssessment,
} from "../types";
import {
  MOCK_DOCTOR,
  MOCK_PATIENTS_LIST,
  MOCK_PATIENT_DETAIL_CHEN,
  MOCK_ALERTS,
  MOCK_REVIEWS,
} from "./mockData";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "cardioguard_doctor_token";
const USER_KEY = "cardioguard_doctor_user";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function patientSummaryToDemographics(patient: {
  patient_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  blood_group?: string | null;
  access_status: string;
  granted_at?: string | null;
}): PatientDemographics {
  const [firstName, ...lastNameParts] = patient.full_name.trim().split(/\s+/);
  return {
    id: patient.patient_id,
    mrn: patient.patient_id,
    firstName: firstName || "Unknown",
    lastName: lastNameParts.join(" "),
    fullName: patient.full_name,
    dateOfBirth: patient.date_of_birth || "N/A",
    age: patient.age || 0,
    gender: patient.gender === "male" || patient.gender === "female" ? patient.gender : "other",
    bloodGroup: patient.blood_group || "N/A",
    phone: patient.phone || "N/A",
    email: patient.email,
    address: "N/A",
    emergencyContact: { name: "N/A", relationship: "N/A", phone: "N/A" },
    accessGranted: patient.access_status === "granted",
    accessGrantedAt: patient.granted_at || undefined,
    primaryPhysicianId: "",
    primaryPhysicianName: "",
    status: "active",
  };
}

function backendPatientToDetail(patient: {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
}): PatientDetail {
  const demographics = patientSummaryToDemographics({
    patient_id: patient.id,
    full_name: patient.full_name,
    email: patient.email,
    phone: patient.phone,
    access_status: "granted",
  });
  const now = new Date().toISOString();
  const currentRisk = {
    id: "",
    patientId: patient.id,
    overallScore: 0,
    riskLevel: "LOW" as const,
    tenYearCvdRiskPercentage: 0,
    primaryFactors: [],
    aiGenerated: false,
    modelVersion: "not-assessed",
    generatedAt: now,
    clinicianReviewed: false,
    recommendations: [],
  };
  const vitalsSummary: PatientDetail["vitalsSummary"] = {};
  return {
    demographics,
    conditions: [],
    allergies: [],
    medications: [],
    currentRisk,
    riskHistory: [],
    recentVitals: [],
    vitalsSummary,
    labs: [],
    ecgs: [],
    notes: [],
    activeAlerts: [],
    assessments: [],
    assessmentSourceMeasurements: [],
  };
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  // Token Management
  public getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public setToken(token: string, user?: Doctor): void {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      // Also write cookie for Next.js middleware support
      document.cookie = `doctor_auth_token=${encodeURIComponent(
        token
      )}; path=/; max-age=86400; SameSite=Strict`;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    }
  }

  public clearToken(): void {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      document.cookie =
        "doctor_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    }
  }

  public getStoredUser(): Doctor | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(USER_KEY);
      if (data) {
        try {
          return JSON.parse(data) as Doctor;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        errorBody.message ||
        errorBody.detail ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  // Auth Methods
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const data = await this.request<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>("/auth/doctor/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const backendUser = await this.request<{
        id: string;
        email: string;
        full_name: string;
        phone?: string | null;
        specialty?: string | null;
        license_number?: string | null;
        hospital_affiliation?: string | null;
        role: Doctor["role"];
      }>("/users/me");
      const user: Doctor = {
        id: backendUser.id,
        name: backendUser.full_name,
        email: backendUser.email,
        specialty: backendUser.specialty || "Cardiology",
        licenseNumber: backendUser.license_number || "",
        hospitalAffiliation: backendUser.hospital_affiliation || "",
        department: backendUser.specialty || "Cardiology",
        phone: backendUser.phone || undefined,
        role: backendUser.role,
      };
      const response: AuthResponse = {
        token: data.access_token,
        refreshToken: data.refresh_token,
        user,
        expiresIn: data.expires_in,
      };
      this.setToken(response.token, response.user);
      return response;
    } catch (error) {
      if (DEMO_MODE && credentials.email && credentials.password.length >= 6) {
        const dummyToken = `cg_jwt_mock_${Date.now()}`;
        const mockAuth: AuthResponse = {
          token: dummyToken,
          user: {
            ...MOCK_DOCTOR,
            email: credentials.email,
          },
          expiresIn: 86400,
        };
        this.setToken(dummyToken, mockAuth.user);
        return mockAuth;
      }
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  }

  public async getProfile(): Promise<Doctor> {
    try {
      const profile = await this.request<{
        id: string; name: string; email: string; specialty?: string;
        license_number?: string; hospital_affiliation?: string; phone?: string;
        role: Doctor["role"];
      }>("/doctor/profile");
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        specialty: profile.specialty || "Cardiology",
        licenseNumber: profile.license_number || "",
        hospitalAffiliation: profile.hospital_affiliation || "",
        department: profile.specialty || "Cardiology",
        phone: profile.phone,
        role: profile.role,
      };
    } catch (error) {
      if (DEMO_MODE) return this.getStoredUser() || MOCK_DOCTOR;
      throw error;
    }
  }

  public async updateProfile(update: DoctorProfileUpdate): Promise<Doctor> {
    try {
      return await this.request<Doctor>("/doctor/profile", {
        method: "PATCH",
        body: JSON.stringify(update),
      });
    } catch (error) {
      if (!DEMO_MODE) throw error;
      const current = this.getStoredUser() || MOCK_DOCTOR;
      const updated = { ...current, ...update };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return updated;
    }
  }

  // Patients Methods
  public async getPatients(
    params?: { search?: string; status?: string }
  ): Promise<PatientDemographics[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.status) query.append("status", params.status);
      const patients = await this.request<Parameters<typeof patientSummaryToDemographics>[0][]>(
        `/doctor/patients?${query.toString()}`
      );
      return patients.map(patientSummaryToDemographics);
    } catch (error) {
      if (!DEMO_MODE) throw error;
      // Return patients filtered by accessGranted
      let list = MOCK_PATIENTS_LIST.filter((p) => p.accessGranted);
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q)
        );
      }
      if (params?.status && params.status !== "all") {
        list = list.filter((p) => p.status === params.status);
      }
      return list;
    }
  }

  public async getPatientById(id: string): Promise<PatientDetail> {
    try {
      const patient = await this.request<{
        id: string;
        full_name: string;
        email: string;
        phone?: string | null;
      }>(`/doctor/patients/${id}`);
      const [assessmentHistory, vitals] = await Promise.all([
        this.getPatientAssessments(id),
        this.getPatientVitals(id),
      ]);
      const detail = backendPatientToDetail(patient);
      return {
        ...detail,
        currentRisk: null,
        assessments: assessmentHistory.assessments,
        assessmentSourceMeasurements: assessmentHistory.source_measurements.map((item) => ({
          id: item.id,
          patientId: id,
          type: item.measurement_type as VitalMeasurement["type"],
          value: item.value_primary,
          secondaryValue: item.value_secondary ?? undefined,
          unit: item.unit,
          timestamp: item.measured_at,
          source: item.source as VitalMeasurement["source"],
        })),
        recentVitals: vitals,
        vitalsSummary: vitals.reduce((summary, measurement) => {
          const key = measurement.type === "heart_rate" ? "lastHeartRate"
            : measurement.type === "blood_pressure" ? "lastBloodPressure"
            : measurement.type === "spo2" ? "lastSpO2"
            : measurement.type === "respiratory_rate" ? "lastRespiratoryRate"
            : measurement.type === "blood_glucose" ? "lastGlucose"
            : measurement.type === "weight" ? "lastWeight" : null;
          if (key && !summary[key]) summary[key] = measurement;
          return summary;
        }, {} as PatientDetail["vitalsSummary"]),
      };
    } catch (error) {
      if (!DEMO_MODE) throw error;
      const found = MOCK_PATIENTS_LIST.find((p) => p.id === id);
      if (found) {
        return {
          ...MOCK_PATIENT_DETAIL_CHEN,
          demographics: found,
        };
      }
      return MOCK_PATIENT_DETAIL_CHEN;
    }
  }

  public async getPatientAssessments(id: string): Promise<{
    patient_id: string;
    assessments: CardiovascularAssessment[];
    source_measurements: Array<{
      id: string;
      measurement_type: string;
      value_primary: number;
      value_secondary?: number | null;
      unit: string;
      source: string;
      measured_at: string;
    }>;
  }> {
    return this.request(`/doctor/patients/${id}/assessments`);
  }

  public async addClinicalNote(
    patientId: string,
    note: { title: string; content: string; category: string }
  ): Promise<ClinicalNote> {
    try {
      return await this.request<ClinicalNote>(
        `/doctor/patients/${patientId}/notes`,
        {
          method: "POST",
          body: JSON.stringify(note),
        }
      );
    } catch (error) {
      if (!DEMO_MODE) throw error;
      const doctor = this.getStoredUser() || MOCK_DOCTOR;
      const createdNote: ClinicalNote = {
        id: `note-${Date.now()}`,
        patientId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        createdAt: new Date().toISOString(),
        title: note.title,
        content: note.content,
        category: note.category as any,
        signed: true,
      };
      return createdNote;
    }
  }

  // Reviews Methods
  public async getPendingReviews(): Promise<ReviewItem[]> {
    try {
      return await this.request<ReviewItem[]>("/doctor/reviews/pending");
    } catch (error) {
      if (DEMO_MODE) return MOCK_REVIEWS;
      throw error;
    }
  }

  public async submitReview(
    reviewId: string,
    payload: { notes: string; approved: boolean; actionItems?: string[] }
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request(`/doctor/reviews/${reviewId}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!DEMO_MODE) throw error;
      return {
        success: true,
        message: "Review successfully finalized and recorded to clinical chart.",
      };
    }
  }

  // Alerts Methods
  public async getAlerts(): Promise<AlertItem[]> {
    try {
      return await this.request<AlertItem[]>("/doctor/alerts");
    } catch (error) {
      if (DEMO_MODE) return MOCK_ALERTS;
      throw error;
    }
  }

  public async acknowledgeAlert(alertId: string): Promise<AlertItem> {
    try {
      return await this.request<AlertItem>(`/doctor/alerts/${alertId}/ack`, {
        method: "POST",
      });
    } catch (error) {
      if (!DEMO_MODE) throw error;
      const doctor = this.getStoredUser() || MOCK_DOCTOR;
      const alert = MOCK_ALERTS.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = doctor.name;
        alert.acknowledgedAt = new Date().toISOString();
        return alert;
      }
      throw new Error("Alert not found");
    }
  }

  // Vitals Methods
  public async getPatientVitals(
    patientId: string,
    limit: number = 50
  ): Promise<VitalMeasurement[]> {
    try {
      const records = await this.request<Array<{
        id: string;
        measurement_type: string;
        value_primary: number;
        value_secondary?: number | null;
        unit: string;
        source: string;
        measured_at: string;
      }>>(
        `/doctor/patients/${patientId}/vitals?limit=${limit}`
      );
      return records.map((item) => ({
        id: item.id,
        patientId,
        type: item.measurement_type as VitalMeasurement["type"],
        value: item.value_primary,
        secondaryValue: item.value_secondary ?? undefined,
        unit: item.unit,
        timestamp: item.measured_at,
        source: item.source as VitalMeasurement["source"],
      }));
    } catch (error) {
      if (!DEMO_MODE) throw error;
      return MOCK_PATIENT_DETAIL_CHEN.recentVitals;
    }
  }
}

export const api = new ApiService();
