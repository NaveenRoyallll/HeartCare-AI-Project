import { api } from './api';
import { UserProfile, AuthTokens } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
}

interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface BackendProfile {
  date_of_birth?: string | null;
  gender?: UserProfile['gender'] | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

function toUserProfile(user: BackendUser, profile: BackendProfile): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phoneNumber: user.phone ?? '',
    dateOfBirth: profile.date_of_birth ?? undefined,
    gender: profile.gender ?? undefined,
    height: profile.height_cm ?? undefined,
    weight: profile.weight_kg ?? undefined,
    emergencyContacts: [],
    medicalHistory: {
      conditions: [],
      allergies: [],
      surgicalHistory: [],
      familyHistoryOfCVD: false,
      smoker: false,
      alcoholIntake: 'none',
      physicalActivityLevel: 'moderate',
    },
    preferences: {
      weightUnit: 'kg',
      heightUnit: 'cm',
      bloodPressureUnit: 'mmHg',
      bloodGlucoseUnit: 'mg/dL',
      language: 'en',
      notificationsEnabled: true,
      emergencyAlertsEnabled: true,
    },
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const tokens = await api.post<BackendTokenResponse>('/auth/login', credentials);
    api.setToken(tokens.access_token);
    const backendUser = await api.get<BackendUser>('/users/me');
    const profile = await api.get<BackendProfile>('/users/me/profile');
    return {
      user: toUserProfile(backendUser, profile),
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      },
    };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await api.post<BackendUser>('/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      phone: data.phoneNumber,
    });
    return this.login({ email: data.email, password: data.password });
  },

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    }
    api.setToken(null);
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/forgot-password', { email });
  },

  async getProfile(): Promise<UserProfile> {
    const user = await api.get<BackendUser>('/users/me');
    const profile = await api.get<BackendProfile>('/users/me/profile');
    return toUserProfile(user, profile);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const updated = await api.put<BackendProfile>('/users/me/profile', {
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      height_cm: profile.height,
      weight_kg: profile.weight,
    });
    const user = await api.get<BackendUser>('/users/me');
    return toUserProfile(user, updated);
  },
};
