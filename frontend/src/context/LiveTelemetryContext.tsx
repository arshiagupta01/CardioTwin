import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { RiskState, DayTelemetry, PatientEHR } from '../types/clinical';
import { evaluateRiskScore } from '../data/cohortData';

export interface LivePatientTelemetry {
  patient_id: number;
  instant_bpm: number;
  instant_hrv: number;
  instant_spo2: number;
  instant_skin_temp: number;
  breathing_phase: 'inhale' | 'exhale';
  respiratory_rate: number;
  packet_count: number;
  last_packet_age_ms: number;
  link_quality: number;
  instant_risk_score: number;
  instant_state: RiskState;
  waveform_sample: number[]; // Rolling micro-waveform points for mini-monitors
}

interface LiveTelemetryContextType {
  isLiveMode: boolean;
  setIsLiveMode: (active: boolean) => void;
  samplingRateHz: number;
  totalPacketsReceived: number;
  streamStatus: 'connected' | 'paused' | 'buffering';
  getPatientLiveTelemetry: (
    patientId: number,
    baseTelemetry: DayTelemetry,
    ehr: PatientEHR
  ) => LivePatientTelemetry;
  clockSeconds: number;
}

const LiveTelemetryContext = createContext<LiveTelemetryContextType | undefined>(undefined);

export const LiveTelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [clockSeconds, setClockSeconds] = useState<number>(0);
  const [totalPackets, setTotalPackets] = useState<number>(14280);
  const startTimeRef = useRef<number>(Date.now());

  // Continuous high-frequency clock for realistic Respiratory Sinus Arrhythmia (RSA)
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setClockSeconds(elapsed);
      setTotalPackets((prev) => prev + 1);
    }, 400); // 2.5 Hz state refresh rate

    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Pure deterministic physiological synthesis function
  // Simulates Respiratory Sinus Arrhythmia (RSA) at ~0.25 Hz (15 breaths/min)
  // and autonomic tone fluctuations based on individual patient pathology
  const getPatientLiveTelemetry = useCallback(
    (patientId: number, baseTelemetry: DayTelemetry, ehr: PatientEHR): LivePatientTelemetry => {
      const t = clockSeconds;
      const seed = (patientId * 37) % 100;
      const phaseOffset = seed * 0.1;

      // Respiratory cycle: ~4.0 seconds per breath (0.25 Hz = 15 breaths/min)
      const respFrequency = 0.23 + (seed % 10) * 0.005; // 0.23 to 0.28 Hz
      const respSin = Math.sin(2 * Math.PI * respFrequency * t + phaseOffset);
      const breathingPhase: 'inhale' | 'exhale' = respSin >= 0 ? 'inhale' : 'exhale';

      // Base vitals from the selected patient profile
      const baseRhr = baseTelemetry.resting_hr_mean;
      const baseHrv = baseTelemetry.hrv_mean;
      const isDecomp = baseTelemetry.state === 'decompensation';
      const isStrain = baseTelemetry.state === 'strain';

      // Autonomic Dynamics:
      // In decompensation: sympathetic overdrive suppresses RSA amplitude (vagal withdrawal),
      // with erratic rapid rate fluctuations.
      // In homeostasis: healthy vagal tone creates pronounced, rhythmic RSA swings.
      let rsaAmplitude = 4.2; // bpm swing
      let microNoise = Math.sin(t * 3.7 + seed) * 0.8;

      if (isDecomp) {
        rsaAmplitude = 1.2; // dampened RSA
        microNoise = Math.sin(t * 7.1 + seed) * 2.4; // sympathetic tremor
      } else if (isStrain) {
        rsaAmplitude = 2.4;
        microNoise = Math.sin(t * 5.2 + seed) * 1.5;
      }

      // Instantaneous BPM (resting baseline + active state offset + RSA oscillation + micro-jitter)
      const stateOffset = isDecomp ? 14 : isStrain ? 6 : 2;
      const instant_bpm = Math.max(
        48,
        Math.min(185, Math.round(baseRhr + stateOffset + respSin * rsaAmplitude + microNoise))
      );

      // Instantaneous HRV (RMSSD in ms)
      // HRV rises slightly during exhale and drops during inhale
      const hrvMod = isDecomp ? 0.8 : 3.5;
      const instant_hrv = Math.max(
        9.0,
        Number((baseHrv - respSin * hrvMod + Math.cos(t * 2.1 + seed) * 0.5).toFixed(1))
      );

      // Instantaneous SpO2 (%)
      let baseSpo2 = 98;
      if (isDecomp) baseSpo2 = 93;
      else if (isStrain) baseSpo2 = 96;
      const instant_spo2 = Math.min(
        100,
        Math.max(88, Math.round(baseSpo2 + (respSin > 0.6 ? 1 : 0) - (isDecomp && t % 8 > 5 ? 1 : 0)))
      );

      // Instantaneous Skin Temperature (°C)
      const baseTemp = 36.6;
      const tempJitter = Math.sin(t * 0.05 + seed) * 0.12;
      const instant_skin_temp = Number((baseTemp + tempJitter).toFixed(2));

      // Dynamic Risk Re-evaluation
      const evaluated = evaluateRiskScore({
        age: ehr.age,
        sex: ehr.sex === 'M' ? 1 : 0,
        bmi: ehr.bmi,
        systolic_bp: ehr.systolic_bp,
        diastolic_bp: ehr.diastolic_bp,
        cholesterol: ehr.cholesterol,
        family_history: ehr.family_history,
        smoker: ehr.smoker,
        diabetes: ehr.diabetes,
        hrv_mean: instant_hrv,
        resting_hr_mean: instant_bpm - 10,
        sleep_hours: baseTelemetry.sleep_hours,
        sleep_efficiency: baseTelemetry.sleep_efficiency,
        daily_steps: baseTelemetry.daily_steps,
        hrv_drop_from_baseline: baseTelemetry.hrv_drop_from_baseline,
        resting_hr_rise_from_baseline: baseTelemetry.resting_hr_rise_from_baseline,
      });

      // Mini-waveform points for compact ECG displays
      const waveform_sample = Array.from({ length: 16 }, (_, i) => {
        const p = ((t * 4 + i * 0.2 + seed) % 3) / 3;
        if (p > 0.24 && p < 0.28) return 1.2; // R peak
        if (p > 0.22 && p <= 0.24) return -0.3; // Q dip
        if (p > 0.28 && p < 0.32) return -0.4; // S dip
        if (p > 0.08 && p < 0.18) return 0.2; // P wave
        if (p > 0.40 && p < 0.60) return 0.25; // T wave
        return 0.0;
      });

      return {
        patient_id: patientId,
        instant_bpm,
        instant_hrv,
        instant_spo2,
        instant_skin_temp,
        breathing_phase: breathingPhase,
        respiratory_rate: Math.round(respFrequency * 60),
        packet_count: totalPackets + seed * 17,
        last_packet_age_ms: Math.round(((t * 1000) % 400) + 12),
        link_quality: 98.4 + (seed % 3) * 0.5,
        instant_risk_score: isLiveMode ? evaluated.score : baseTelemetry.risk_score,
        instant_state: isLiveMode ? evaluated.state : baseTelemetry.state,
        waveform_sample,
      };
    },
    [clockSeconds, isLiveMode, totalPackets]
  );

  return (
    <LiveTelemetryContext.Provider
      value={{
        isLiveMode,
        setIsLiveMode,
        samplingRateHz: 128,
        totalPacketsReceived: totalPackets,
        streamStatus: isLiveMode ? 'connected' : 'paused',
        getPatientLiveTelemetry,
        clockSeconds,
      }}
    >
      {children}
    </LiveTelemetryContext.Provider>
  );
};

export const useLiveTelemetry = () => {
  const context = useContext(LiveTelemetryContext);
  if (!context) {
    throw new Error('useLiveTelemetry must be used within a LiveTelemetryProvider');
  }
  return context;
};
