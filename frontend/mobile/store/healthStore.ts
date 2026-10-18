import { create } from 'zustand';
import { VitalMeasurement, VitalType, CardiovascularRiskScore, RiskFactor } from '../types/health';
import { Medication } from '../types/medication';
import { api } from '../services/api';

interface HealthState {
  measurements: VitalMeasurement[];
  medications: Medication[];
  riskScore: CardiovascularRiskScore;
  riskFactors: RiskFactor[];
  isLoading: boolean;
  dataSource: 'live' | 'empty';
  error: string | null;

  initialize: () => Promise<void>;
  addMeasurement: (measurement: Omit<VitalMeasurement, 'id'>) => Promise<void>;
  getLatestMeasurement: (type: VitalType) => VitalMeasurement | undefined;
  getMeasurementsByType: (type: VitalType) => VitalMeasurement[];
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<void>;
  toggleMedicationActive: (id: string) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

const INITIAL_RISK_SCORE: CardiovascularRiskScore = {
  score: 0,
  category: 'low',
  calculatedAt: '',
  factorsIdentified: [],
  keyRecommendations: [],
  disclaimer: 'No live risk assessment is available yet. This is not a clinical result.',
};

const INITIAL_RISK_FACTORS: RiskFactor[] = [];

export const useHealthStore = create<HealthState>((set, get) => ({
  measurements: [],
  medications: [],
  riskScore: INITIAL_RISK_SCORE,
  riskFactors: INITIAL_RISK_FACTORS,
  isLoading: false,
  dataSource: 'empty',
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.listVitals<{ items: Array<{
        id: string; measurement_type: string; value_primary: number;
        value_secondary?: number; unit: string; source: string;
        measured_at: string;
      }> }>();
      const measurements = response.items.map((item) => ({
        id: item.id,
        type: item.measurement_type === 'blood_pressure' ? 'bp' : item.measurement_type === 'blood_glucose' ? 'glucose' : item.measurement_type as VitalType,
        value: item.value_primary,
        secondaryValue: item.value_secondary,
        unit: item.unit,
        recordedAt: item.measured_at,
        source: item.source as VitalMeasurement['source'],
        status: 'normal' as const,
      }));
      const backendMeds = await api.get<Array<{
        id: string; name: string; dosage: string; frequency: string;
        instructions?: string | null; start_date: string; end_date?: string | null;
        is_active: boolean;
      }>>('/medications/');
      const medications = backendMeds.map((item) => ({
        id: item.id,
        name: item.name,
        dosage: item.dosage,
        frequency: item.frequency as Medication['frequency'],
        times: [],
        timing: 'after_food' as Medication['timing'],
        startDate: item.start_date,
        endDate: item.end_date || undefined,
        instructions: item.instructions || undefined,
        isActive: item.is_active,
      }));
      set({ measurements, medications, dataSource: 'live', isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unable to load live health data' });
    }
  },

  addMeasurement: async (measurement) => {
    const type = measurement.type === 'bp' ? 'blood_pressure' : measurement.type === 'glucose' ? 'blood_glucose' : measurement.type;
    const saved = await api.post<{ id: string; measured_at: string }>('/vitals/', {
      measurement_type: type,
      value_primary: measurement.value,
      value_secondary: measurement.secondaryValue,
      unit: measurement.unit,
      source: measurement.source,
      notes: measurement.notes,
      measured_at: measurement.recordedAt,
    });
    set((state) => ({ measurements: [{ ...measurement, id: saved.id, recordedAt: saved.measured_at }, ...state.measurements], dataSource: 'live' }));
  },

  getLatestMeasurement: (type: VitalType) => {
    const measurements = get().measurements;
    return measurements
      .filter((m) => m.type === type)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  },

  getMeasurementsByType: (type: VitalType) => {
    return get()
      .measurements.filter((m) => m.type === type)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  },

  addMedication: async (medication) => {
    const saved = await api.post<{ id: string }>('/medications/', {
      name: medication.name,
      dosage: medication.dosage,
      form: 'tablet',
      frequency: medication.frequency,
      instructions: medication.instructions,
      start_date: medication.startDate,
      end_date: medication.endDate,
      is_active: medication.isActive,
    });
    set((state) => ({ medications: [{ ...medication, id: saved.id }, ...state.medications] }));
  },

  toggleMedicationActive: async (id: string) => {
    const current = get().medications.find((medication) => medication.id === id);
    if (!current) return;
    await api.put(`/medications/${id}`, { is_active: !current.isActive });
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      ),
    }));
  },

  deleteMedication: async (id: string) => {
    await api.delete(`/medications/${id}`);
    set((state) => ({
      medications: state.medications.filter((m) => m.id !== id),
    }));
  },
}));
