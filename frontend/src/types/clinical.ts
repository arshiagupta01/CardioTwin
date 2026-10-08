export type RiskState = 'homeostasis' | 'strain' | 'decompensation';

export interface PatientEHR {
  patient_id: number;
  name: string;
  age: number;
  sex: 'M' | 'F';
  bmi: number;
  systolic_bp: number;
  diastolic_bp: number;
  cholesterol: number;
  ldl: number;
  hdl: number;
  fasting_glucose: number;
  hba1c: number;
  family_history: number;
  smoker: number;
  diabetes: number;
  diagnosis: string;
  medications: string[];
}

export interface DayTelemetry {
  patient_id: number;
  day_index: number;
  timestamp?: string;
  hrv_mean: number;
  resting_hr_mean: number;
  mean_hr: number;
  sleep_hours: number;
  sleep_efficiency: number;
  daily_steps: number;
  activity_score: number;
  risk_event_next_24h: number;
  risk_score: number;
  state: RiskState;

  // Dynamic deltas from personal baseline
  hrv_drop_from_baseline: number;
  resting_hr_rise_from_baseline: number;
  sleep_drop_from_baseline: number;
  step_drop_from_baseline: number;
}

export interface SHAPContribution {
  feature: string;
  label: string;
  impact_percent: number;
  direction: 'elevate' | 'protective';
  clinical_note: string;
}

export interface CounterfactualScenario {
  target_hrv: number;
  target_resting_hr: number;
  target_sleep_hours: number;
  target_systolic_bp: number;
  simulated_risk: number;
  simulated_state: RiskState;
}

export interface PatientProfile {
  ehr: PatientEHR;
  telemetry_series: DayTelemetry[];
  current_day: number;
  latest_telemetry: DayTelemetry;
  hardware: {
    battery_level: number;
    ble_rssi: string;
    ble_fidelity: number;
    skin_temp_c: number;
    device_model: string;
    last_sync: string;
  };
}

export interface CohortStats {
  total_monitored: number;
  critical_count: number;
  warning_count: number;
  stable_count: number;
  hypertension_count?: number;
  cardiovascular_risk_count?: number;
  diabetic_count?: number;
  avg_risk: number;
  sync_uptime_pct: number;
}

