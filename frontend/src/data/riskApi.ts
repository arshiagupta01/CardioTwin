import { DayTelemetry, PatientProfile } from '../types/clinical';

export interface ModelFeatures {
  age: number;
  sex: number;
  bmi: number;
  systolic_bp: number;
  diastolic_bp: number;
  cholesterol: number;
  family_history: number;
  smoker: number;
  diabetes: number;
  hrv_mean: number;
  resting_hr_mean: number;
  mean_hr: number;
  sleep_hours: number;
  sleep_efficiency: number;
  daily_steps: number;
  activity_score: number;
  hrv_drop_from_baseline: number;
  sleep_drop_from_baseline: number;
  step_drop_from_baseline: number;
  resting_hr_rise_from_baseline: number;
}

export interface ModelPrediction {
  risk_score: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  state: DayTelemetry['state'];
}

export interface ModelImportance {
  feature: string;
  importance: number;
}

export async function fetchPatients(): Promise<PatientProfile[]> {
  const response = await fetch('/api/patients');
  if (!response.ok) throw new Error(`Patient API returned ${response.status}`);
  const result: { patients: PatientProfile[] } = await response.json();
  return result.patients;
}

export async function savePatient(patient: PatientProfile): Promise<PatientProfile> {
  const response = await fetch(`/api/patients/${patient.ehr.patient_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!response.ok) throw new Error(`Patient save returned ${response.status}`);
  return response.json();
}

export function toModelFeatures(
  patient: PatientProfile,
  telemetry: DayTelemetry,
  systolicBp = patient.ehr.systolic_bp,
): ModelFeatures {
  const baseline = patient.telemetry_series[0] ?? telemetry;
  return {
    age: patient.ehr.age,
    sex: patient.ehr.sex === 'M' ? 1 : 0,
    bmi: patient.ehr.bmi,
    systolic_bp: systolicBp,
    diastolic_bp: patient.ehr.diastolic_bp,
    cholesterol: patient.ehr.cholesterol,
    family_history: patient.ehr.family_history,
    smoker: patient.ehr.smoker,
    diabetes: patient.ehr.diabetes,
    hrv_mean: telemetry.hrv_mean,
    resting_hr_mean: telemetry.resting_hr_mean,
    mean_hr: telemetry.mean_hr,
    sleep_hours: telemetry.sleep_hours,
    sleep_efficiency: telemetry.sleep_efficiency,
    daily_steps: telemetry.daily_steps,
    activity_score: telemetry.activity_score,
    hrv_drop_from_baseline: baseline.hrv_mean - telemetry.hrv_mean,
    sleep_drop_from_baseline: baseline.sleep_hours - telemetry.sleep_hours,
    step_drop_from_baseline: baseline.daily_steps - telemetry.daily_steps,
    resting_hr_rise_from_baseline: telemetry.resting_hr_mean - baseline.resting_hr_mean,
  };
}

export async function predictRisk(features: ModelFeatures, signal?: AbortSignal): Promise<ModelPrediction> {
  const response = await fetch('/api/risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
    signal,
  });
  if (!response.ok) throw new Error(`Risk API returned ${response.status}`);
  return response.json();
}

export async function predictRiskBatch(features: ModelFeatures[]): Promise<ModelPrediction[]> {
  const response = await fetch('/api/risk/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: features }),
  });
  if (!response.ok) throw new Error(`Risk API returned ${response.status}`);
  const result: { predictions: ModelPrediction[] } = await response.json();
  return result.predictions;
}

export async function fetchModelImportance(): Promise<{ model: string; roc_auc: number | null; features: ModelImportance[] }> {
  const response = await fetch('/api/model/importance');
  if (!response.ok) throw new Error(`Model metadata API returned ${response.status}`);
  return response.json();
}
