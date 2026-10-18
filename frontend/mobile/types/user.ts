export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface MedicalCondition {
  id: string;
  condition: string;
  diagnosedYear?: number;
  notes?: string;
}

export interface MedicalHistory {
  conditions: MedicalCondition[];
  allergies: string[];
  surgicalHistory: string[];
  familyHistoryOfCVD: boolean; // Cardiovascular disease in first-degree relatives
  smoker: boolean;
  alcoholIntake: 'none' | 'occasional' | 'regular';
  physicalActivityLevel: 'sedentary' | 'moderate' | 'active';
}

export interface UserPreferences {
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'feet_inches';
  bloodPressureUnit: 'mmHg';
  bloodGlucoseUnit: 'mg/dL' | 'mmol/L';
  language: 'en' | 'hi';
  notificationsEnabled: boolean;
  emergencyAlertsEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number; // in cm
  weight?: number; // in kg
  emergencyContacts: EmergencyContact[];
  medicalHistory: MedicalHistory;
  preferences: UserPreferences;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}
