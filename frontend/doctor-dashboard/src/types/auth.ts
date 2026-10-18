export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  hospitalAffiliation: string;
  department: string;
  avatarUrl?: string;
  phone?: string;
  role: "doctor" | "cardiologist" | "admin";
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: Doctor;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface DoctorProfileUpdate {
  name?: string;
  specialty?: string;
  hospitalAffiliation?: string;
  phone?: string;
  notificationPreferences?: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    criticalOnly: boolean;
    dailyDigest: boolean;
  };
}
