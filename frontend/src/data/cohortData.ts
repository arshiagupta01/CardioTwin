import { PatientProfile, CohortStats, SHAPContribution, CounterfactualScenario, RiskState } from '../types/clinical';

export const INITIAL_COHORT: PatientProfile[] = [
  {
    ehr: {
      patient_id: 101,
      name: "Ravi Sharma",
      age: 58,
      sex: "M",
      bmi: 28.4,
      systolic_bp: 148,
      diastolic_bp: 94,
      cholesterol: 230,
      ldl: 145,
      hdl: 38,
      fasting_glucose: 118,
      hba1c: 6.8,
      family_history: 1,
      smoker: 1,
      diabetes: 1,
      diagnosis: "Stage 2 Hypertension / Post-PCI CAD",
      medications: [
        "Telmisartan 40mg PO OD",
        "Atorvastatin 20mg PO QHS",
        "Metformin 500mg PO BID",
        "Aspirin 75mg PO OD"
      ]
    },
    current_day: 7,
    hardware: {
      battery_level: 94,
      ble_rssi: "-62 dBm",
      ble_fidelity: 98.4,
      skin_temp_c: 36.8,
      device_model: "CardioTwin BioPatch v4.2 BLE",
      last_sync: "12 sec ago"
    },
    telemetry_series: [
      {
        patient_id: 101,
        day_index: 1,
        hrv_mean: 46.2,
        resting_hr_mean: 66.4,
        mean_hr: 74.2,
        sleep_hours: 7.2,
        sleep_efficiency: 0.89,
        daily_steps: 8420,
        activity_score: 82.5,
        risk_event_next_24h: 0,
        risk_score: 0.038,
        state: "homeostasis",
        hrv_drop_from_baseline: 0.0,
        resting_hr_rise_from_baseline: 0.0,
        sleep_drop_from_baseline: 0.0,
        step_drop_from_baseline: 0.0,
      },
      {
        patient_id: 101,
        day_index: 2,
        hrv_mean: 45.8,
        resting_hr_mean: 67.1,
        mean_hr: 75.0,
        sleep_hours: 7.0,
        sleep_efficiency: 0.87,
        daily_steps: 7980,
        activity_score: 79.4,
        risk_event_next_24h: 0,
        risk_score: 0.003,
        state: "homeostasis",
        hrv_drop_from_baseline: 0.4,
        resting_hr_rise_from_baseline: 0.7,
        sleep_drop_from_baseline: 0.2,
        step_drop_from_baseline: 440,
      },
      {
        patient_id: 101,
        day_index: 3,
        hrv_mean: 42.4,
        resting_hr_mean: 69.5,
        mean_hr: 77.2,
        sleep_hours: 6.4,
        sleep_efficiency: 0.81,
        daily_steps: 7210,
        activity_score: 72.0,
        risk_event_next_24h: 0,
        risk_score: 0.007,
        state: "homeostasis",
        hrv_drop_from_baseline: 3.8,
        resting_hr_rise_from_baseline: 3.1,
        sleep_drop_from_baseline: 0.8,
        step_drop_from_baseline: 1210,
      },
      {
        patient_id: 101,
        day_index: 4,
        hrv_mean: 38.6,
        resting_hr_mean: 72.8,
        mean_hr: 81.0,
        sleep_hours: 5.8,
        sleep_efficiency: 0.76,
        daily_steps: 6140,
        activity_score: 63.8,
        risk_event_next_24h: 0,
        risk_score: 0.044,
        state: "homeostasis",
        hrv_drop_from_baseline: 7.6,
        resting_hr_rise_from_baseline: 6.4,
        sleep_drop_from_baseline: 1.4,
        step_drop_from_baseline: 2280,
      },
      {
        patient_id: 101,
        day_index: 5,
        hrv_mean: 31.2,
        resting_hr_mean: 77.4,
        mean_hr: 86.5,
        sleep_hours: 5.2,
        sleep_efficiency: 0.69,
        daily_steps: 4320,
        activity_score: 48.2,
        risk_event_next_24h: 0,
        risk_score: 0.352,
        state: "strain",
        hrv_drop_from_baseline: 15.0,
        resting_hr_rise_from_baseline: 11.0,
        sleep_drop_from_baseline: 2.0,
        step_drop_from_baseline: 4100,
      },
      {
        patient_id: 101,
        day_index: 6,
        hrv_mean: 26.5,
        resting_hr_mean: 82.0,
        mean_hr: 91.2,
        sleep_hours: 4.8,
        sleep_efficiency: 0.64,
        daily_steps: 3200,
        activity_score: 38.5,
        risk_event_next_24h: 0,
        risk_score: 0.415,
        state: "strain",
        hrv_drop_from_baseline: 19.7,
        resting_hr_rise_from_baseline: 15.6,
        sleep_drop_from_baseline: 2.4,
        step_drop_from_baseline: 5220,
      },
      {
        patient_id: 101,
        day_index: 7,
        hrv_mean: 20.8,
        resting_hr_mean: 86.8,
        mean_hr: 96.4,
        sleep_hours: 4.1,
        sleep_efficiency: 0.58,
        daily_steps: 1940,
        activity_score: 24.1,
        risk_event_next_24h: 1,
        risk_score: 0.805,
        state: "decompensation",
        hrv_drop_from_baseline: 25.4,
        resting_hr_rise_from_baseline: 20.4,
        sleep_drop_from_baseline: 3.1,
        step_drop_from_baseline: 6480,
      },
      {
        patient_id: 101,
        day_index: 8,
        hrv_mean: 24.0,
        resting_hr_mean: 84.5,
        mean_hr: 93.0,
        sleep_hours: 4.9,
        sleep_efficiency: 0.65,
        daily_steps: 2580,
        activity_score: 32.4,
        risk_event_next_24h: 1,
        risk_score: 0.531,
        state: "strain",
        hrv_drop_from_baseline: 22.2,
        resting_hr_rise_from_baseline: 18.1,
        sleep_drop_from_baseline: 2.3,
        step_drop_from_baseline: 5840,
      },
      {
        patient_id: 101,
        day_index: 9,
        hrv_mean: 34.5,
        resting_hr_mean: 76.2,
        mean_hr: 83.5,
        sleep_hours: 6.1,
        sleep_efficiency: 0.77,
        daily_steps: 5120,
        activity_score: 56.8,
        risk_event_next_24h: 0,
        risk_score: 0.207,
        state: "strain",
        hrv_drop_from_baseline: 11.7,
        resting_hr_rise_from_baseline: 9.8,
        sleep_drop_from_baseline: 1.1,
        step_drop_from_baseline: 3300,
      },
      {
        patient_id: 101,
        day_index: 10,
        hrv_mean: 39.8,
        resting_hr_mean: 71.0,
        mean_hr: 79.0,
        sleep_hours: 6.8,
        sleep_efficiency: 0.83,
        daily_steps: 6840,
        activity_score: 71.2,
        risk_event_next_24h: 0,
        risk_score: 0.308,
        state: "strain",
        hrv_drop_from_baseline: 6.4,
        resting_hr_rise_from_baseline: 4.6,
        sleep_drop_from_baseline: 0.4,
        step_drop_from_baseline: 1580,
      }
    ],
    latest_telemetry: {
      patient_id: 101,
      day_index: 7,
      hrv_mean: 20.8,
      resting_hr_mean: 86.8,
      mean_hr: 96.4,
      sleep_hours: 4.1,
      sleep_efficiency: 0.58,
      daily_steps: 1940,
      activity_score: 24.1,
      risk_event_next_24h: 1,
      risk_score: 0.805,
      state: "decompensation",
      hrv_drop_from_baseline: 25.4,
      resting_hr_rise_from_baseline: 20.4,
      sleep_drop_from_baseline: 3.1,
      step_drop_from_baseline: 6480,
    }
  },
  {
    ehr: {
      patient_id: 102,
      name: "Ananya Patel",
      age: 64,
      sex: "F",
      bmi: 24.2,
      systolic_bp: 122,
      diastolic_bp: 78,
      cholesterol: 172,
      ldl: 98,
      hdl: 52,
      fasting_glucose: 94,
      hba1c: 5.6,
      family_history: 0,
      smoker: 0,
      diabetes: 0,
      diagnosis: "Post-CABG Surveillance / Normal Baseline",
      medications: ["Metoprolol Succinate 25mg PO OD", "Rosuvastatin 10mg PO QHS"]
    },
    current_day: 7,
    hardware: {
      battery_level: 88,
      ble_rssi: "-58 dBm",
      ble_fidelity: 99.1,
      skin_temp_c: 36.6,
      device_model: "CardioTwin BioPatch v4.2 BLE",
      last_sync: "4 sec ago"
    },
    telemetry_series: generateStableSeries(102, 52.0, 62.0, 7.4),
    latest_telemetry: {
      patient_id: 102,
      day_index: 7,
      hrv_mean: 51.4,
      resting_hr_mean: 62.1,
      mean_hr: 70.3,
      sleep_hours: 7.3,
      sleep_efficiency: 0.91,
      daily_steps: 8900,
      activity_score: 86.0,
      risk_event_next_24h: 0,
      risk_score: 0.082,
      state: "homeostasis",
      hrv_drop_from_baseline: 0.6,
      resting_hr_rise_from_baseline: 0.1,
      sleep_drop_from_baseline: 0.1,
      step_drop_from_baseline: 0,
    }
  },
  {
    ehr: {
      patient_id: 103,
      name: "Rajesh Verma",
      age: 61,
      sex: "M",
      bmi: 30.1,
      systolic_bp: 138,
      diastolic_bp: 88,
      cholesterol: 215,
      ldl: 138,
      hdl: 41,
      fasting_glucose: 124,
      hba1c: 7.1,
      family_history: 1,
      smoker: 0,
      diabetes: 1,
      diagnosis: "Metabolic Syndrome & Moderate Autonomic Strain",
      medications: ["Amlodipine 5mg PO OD", "Metformin 850mg PO BID"]
    },
    current_day: 7,
    hardware: {
      battery_level: 72,
      ble_rssi: "-69 dBm",
      ble_fidelity: 96.0,
      skin_temp_c: 37.0,
      device_model: "CardioTwin BioPatch v4.2 BLE",
      last_sync: "28 sec ago"
    },
    telemetry_series: generateStrainSeries(103, 34.0, 76.0, 5.8),
    latest_telemetry: {
      patient_id: 103,
      day_index: 7,
      hrv_mean: 29.2,
      resting_hr_mean: 79.4,
      mean_hr: 87.2,
      sleep_hours: 5.4,
      sleep_efficiency: 0.71,
      daily_steps: 4200,
      activity_score: 49.0,
      risk_event_next_24h: 0,
      risk_score: 0.486,
      state: "strain",
      hrv_drop_from_baseline: 8.8,
      resting_hr_rise_from_baseline: 7.4,
      sleep_drop_from_baseline: 1.4,
      step_drop_from_baseline: 2400,
    }
  },
  {
    ehr: {
      patient_id: 104,
      name: "Sunita Rao",
      age: 52,
      sex: "F",
      bmi: 31.8,
      systolic_bp: 162,
      diastolic_bp: 98,
      cholesterol: 248,
      ldl: 165,
      hdl: 36,
      fasting_glucose: 142,
      hba1c: 7.6,
      family_history: 1,
      smoker: 1,
      diabetes: 1,
      diagnosis: "Refractory Hypertension / Severe Decompensation",
      medications: ["Telmisartan 80mg + HCTZ 12.5mg", "Amlodipine 10mg PO OD"]
    },
    current_day: 7,
    hardware: {
      battery_level: 64,
      ble_rssi: "-74 dBm",
      ble_fidelity: 94.2,
      skin_temp_c: 37.2,
      device_model: "CardioTwin BioPatch v4.2 BLE",
      last_sync: "1 min ago"
    },
    telemetry_series: generateDecompensationSeries(104, 21.0, 88.0, 4.2),
    latest_telemetry: {
      patient_id: 104,
      day_index: 7,
      hrv_mean: 19.4,
      resting_hr_mean: 88.2,
      mean_hr: 98.0,
      sleep_hours: 4.2,
      sleep_efficiency: 0.54,
      daily_steps: 1720,
      activity_score: 22.0,
      risk_event_next_24h: 1,
      risk_score: 0.762,
      state: "decompensation",
      hrv_drop_from_baseline: 24.1,
      resting_hr_rise_from_baseline: 19.0,
      sleep_drop_from_baseline: 2.8,
      step_drop_from_baseline: 5900,
    }
  },
  {
    ehr: {
      patient_id: 105,
      name: "Vikram Malhotra",
      age: 49,
      sex: "M",
      bmi: 26.8,
      systolic_bp: 134,
      diastolic_bp: 84,
      cholesterol: 198,
      ldl: 122,
      hdl: 46,
      fasting_glucose: 108,
      hba1c: 6.1,
      family_history: 0,
      smoker: 0,
      diabetes: 0,
      diagnosis: "Borderline Hypertension / Autonomic Stress Shift",
      medications: ["Lifestyle modification / Exercise prescription"]
    },
    current_day: 7,
    hardware: {
      battery_level: 91,
      ble_rssi: "-54 dBm",
      ble_fidelity: 99.4,
      skin_temp_c: 36.7,
      device_model: "CardioTwin BioPatch v4.2 BLE",
      last_sync: "9 sec ago"
    },
    telemetry_series: generateStrainSeries(105, 38.0, 71.0, 6.2),
    latest_telemetry: {
      patient_id: 105,
      day_index: 7,
      hrv_mean: 34.6,
      resting_hr_mean: 73.8,
      mean_hr: 81.5,
      sleep_hours: 5.9,
      sleep_efficiency: 0.74,
      daily_steps: 5400,
      activity_score: 58.0,
      risk_event_next_24h: 0,
      risk_score: 0.285,
      state: "strain",
      hrv_drop_from_baseline: 9.4,
      resting_hr_rise_from_baseline: 5.8,
      sleep_drop_from_baseline: 1.1,
      step_drop_from_baseline: 2800,
    }
  }
];

function generateStableSeries(pid: number, hrvBase: number, rhrBase: number, sleepBase: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    patient_id: pid,
    day_index: i + 1,
    hrv_mean: Number((hrvBase + (Math.sin(i) * 3)).toFixed(1)),
    resting_hr_mean: Number((rhrBase + (Math.cos(i) * 2)).toFixed(1)),
    mean_hr: Number((rhrBase + 8 + (Math.sin(i) * 2)).toFixed(1)),
    sleep_hours: Number((sleepBase + (Math.sin(i * 0.8) * 0.4)).toFixed(1)),
    sleep_efficiency: Number((0.88 + (Math.sin(i) * 0.04)).toFixed(2)),
    daily_steps: Math.round(8500 + (Math.sin(i) * 800)),
    activity_score: 84.0,
    risk_event_next_24h: 0,
    risk_score: Number((0.05 + Math.random() * 0.08).toFixed(3)),
    state: "homeostasis" as const,
    hrv_drop_from_baseline: 0,
    resting_hr_rise_from_baseline: 0,
    sleep_drop_from_baseline: 0,
    step_drop_from_baseline: 0
  }));
}

function generateStrainSeries(pid: number, hrvBase: number, rhrBase: number, sleepBase: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const progress = i / 9;
    return {
      patient_id: pid,
      day_index: i + 1,
      hrv_mean: Number((hrvBase - progress * 10).toFixed(1)),
      resting_hr_mean: Number((rhrBase + progress * 8).toFixed(1)),
      mean_hr: Number((rhrBase + 8 + progress * 9).toFixed(1)),
      sleep_hours: Number((sleepBase - progress * 1.2).toFixed(1)),
      sleep_efficiency: Number((0.82 - progress * 0.12).toFixed(2)),
      daily_steps: Math.round(7500 - progress * 3200),
      activity_score: Number((75 - progress * 30).toFixed(1)),
      risk_event_next_24h: 0,
      risk_score: Number((0.15 + progress * 0.35).toFixed(3)),
      state: (i > 4 ? 'strain' : 'homeostasis') as RiskState,
      hrv_drop_from_baseline: Number((progress * 10).toFixed(1)),
      resting_hr_rise_from_baseline: Number((progress * 8).toFixed(1)),
      sleep_drop_from_baseline: Number((progress * 1.2).toFixed(1)),
      step_drop_from_baseline: Math.round(progress * 3200)
    };
  });
}

function generateDecompensationSeries(pid: number, hrvBase: number, rhrBase: number, sleepBase: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const progress = Math.min(1.0, i / 6);
    const isCrisis = i >= 6;
    return {
      patient_id: pid,
      day_index: i + 1,
      hrv_mean: Number((hrvBase + 24 - progress * 24).toFixed(1)),
      resting_hr_mean: Number((rhrBase - 18 + progress * 18).toFixed(1)),
      mean_hr: Number((rhrBase - 10 + progress * 20).toFixed(1)),
      sleep_hours: Number((sleepBase + 2.5 - progress * 2.5).toFixed(1)),
      sleep_efficiency: Number((0.85 - progress * 0.3).toFixed(2)),
      daily_steps: Math.round(8000 - progress * 6200),
      activity_score: Number((80 - progress * 58).toFixed(1)),
      risk_event_next_24h: isCrisis ? 1 : 0,
      risk_score: isCrisis ? 0.762 : Number((0.10 + progress * 0.55).toFixed(3)),
      state: (isCrisis ? 'decompensation' : (i >= 4 ? 'strain' : 'homeostasis')) as RiskState,
      hrv_drop_from_baseline: Number((progress * 24).toFixed(1)),
      resting_hr_rise_from_baseline: Number((progress * 18).toFixed(1)),
      sleep_drop_from_baseline: Number((progress * 2.5).toFixed(1)),
      step_drop_from_baseline: Math.round(progress * 6200)
    };
  });
}

export const COHORT_STATS: CohortStats = {
  total_monitored: 200,
  critical_count: 54,
  warning_count: 40,
  stable_count: 106,
  hypertension_count: 161,
  cardiovascular_risk_count: 39,
  diabetic_count: 58,
  avg_risk: 0.385,
  sync_uptime_pct: 98.4
};

export const SHAP_EXPLANATION_RAVI: SHAPContribution[] = [
  {
    feature: "hrv_drop_from_baseline",
    label: "Acute HRV Decline (-25.4 ms drop)",
    impact_percent: 32.4,
    direction: "elevate",
    clinical_note: "Autonomic parasympathetic withdrawal detected across 72h window"
  },
  {
    feature: "resting_hr_rise_from_baseline",
    label: "Resting Heart Rate Rise (+20.4 bpm)",
    impact_percent: 21.1,
    direction: "elevate",
    clinical_note: "Sustained sympathetic overdrive, nocturnal non-dipping profile"
  },
  {
    feature: "systolic_bp",
    label: "Elevated Baseline Systolic BP (148 mmHg)",
    impact_percent: 15.3,
    direction: "elevate",
    clinical_note: "High afterload and arterial wall sheer stress vulnerability"
  },
  {
    feature: "sleep_drop_from_baseline",
    label: "Sleep Fragmentation & Deficit (4.1 hrs, 58% eff)",
    impact_percent: 8.2,
    direction: "elevate",
    clinical_note: "Severe recovery suppression and circadian vascular dysregulation"
  },
  {
    feature: "bmi_and_diabetes",
    label: "Cardiometabolic Risk (BMI 28.4 + T2D)",
    impact_percent: 3.5,
    direction: "elevate",
    clinical_note: "Microvascular endothelial impairment and elevated vascular stiffness"
  }
];

// Client-side ML Model approximation (trained on 20 features) for instant offline inference & What-If sandbox
export function evaluateRiskScore(features: {
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
  sleep_hours: number;
  sleep_efficiency: number;
  daily_steps: number;
  hrv_drop_from_baseline?: number;
  resting_hr_rise_from_baseline?: number;
}): { score: number; state: 'homeostasis' | 'strain' | 'decompensation'; topDrivers: SHAPContribution[] } {
  const hrvDrop = features.hrv_drop_from_baseline ?? Math.max(0, 48 - features.hrv_mean);
  const rhrRise = features.resting_hr_rise_from_baseline ?? Math.max(0, features.resting_hr_mean - 68);
  const sleepDrop = Math.max(0, 7.2 - features.sleep_hours);
  const bpStress = Math.max(0, (features.systolic_bp - 120) / 40);

  // Calibrated surrogate scoring mirroring the Random Forest ensemble:
  let raw = 0.05;
  raw += (hrvDrop / 30) * 0.38;
  raw += (rhrRise / 25) * 0.26;
  raw += bpStress * 0.16;
  raw += (sleepDrop / 3.5) * 0.10;
  raw += (features.smoker ? 0.06 : 0);
  raw += (features.diabetes ? 0.05 : 0);
  raw += (features.bmi > 30 ? 0.04 : 0);

  const score = Math.max(0.01, Math.min(0.96, Number(raw.toFixed(3))));
  const state = score >= 0.65 ? 'decompensation' : score >= 0.25 ? 'strain' : 'homeostasis';

  const drivers: SHAPContribution[] = [
    {
      feature: "hrv_mean",
      label: `HRV Level (${features.hrv_mean.toFixed(1)} ms, -${hrvDrop.toFixed(1)} ms drop)`,
      impact_percent: Math.round((hrvDrop / 30) * 35),
      direction: hrvDrop > 10 ? 'elevate' : 'protective',
      clinical_note: hrvDrop > 10 ? 'Autonomic vagal withdrawal detected' : 'Autonomic tone preserved'
    },
    {
      feature: "resting_hr",
      label: `Resting Heart Rate (${features.resting_hr_mean.toFixed(1)} bpm, +${rhrRise.toFixed(1)} bpm)`,
      impact_percent: Math.round((rhrRise / 25) * 25),
      direction: rhrRise > 8 ? 'elevate' : 'protective',
      clinical_note: rhrRise > 8 ? 'Sympathetic overactivity' : 'Resting rhythm within normal limits'
    },
    {
      feature: "systolic_bp",
      label: `Systolic Blood Pressure (${features.systolic_bp} mmHg)`,
      impact_percent: Math.round(bpStress * 18),
      direction: features.systolic_bp > 135 ? 'elevate' : 'protective',
      clinical_note: features.systolic_bp > 140 ? 'Stage 2 HTN vascular afterload' : 'Arterial pressure regulated'
    },
    {
      feature: "sleep_hours",
      label: `Sleep Duration (${features.sleep_hours.toFixed(1)} hrs)`,
      impact_percent: Math.round((sleepDrop / 3) * 12),
      direction: features.sleep_hours < 6 ? 'elevate' : 'protective',
      clinical_note: features.sleep_hours < 6 ? 'Significant restorative sleep deficit' : 'Healthy sleep architecture'
    }
  ];

  return { score, state, topDrivers: drivers };
}
