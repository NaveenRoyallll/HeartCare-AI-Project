export interface EmergencySymptom {
  id: string;
  name: string;
  description: string;
  isRedFlag: boolean; // Indicates immediate medical emergency
}

export interface EmergencyWarningSign {
  id: string;
  title: string;
  description: string;
  iconName: string;
  actionRequired: string;
}

export interface EmergencyProtocol {
  emergencyNumber: string; // "112" for National Emergency Support in India
  ambulanceNumber: string; // "102" / "108"
  criticalWarning: string;
  immediateActions: string[];
  offlineGuidance: string[];
}
