import React, { useState } from 'react';
import { PatientProfile, DayTelemetry } from '../types/clinical';
import { evaluateRiskScore } from '../data/cohortData';
import { X, PlusCircle, Smartphone, Activity, FileText, CheckCircle2, RefreshCw, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RecordIntakeModalProps {
  cohort: PatientProfile[];
  isOpen: boolean;
  onClose: () => void;
  onRecordAdded: (newProfile: PatientProfile) => void;
}

export const RecordIntakeModal: React.FC<RecordIntakeModalProps> = ({
  cohort,
  isOpen,
  onClose,
  onRecordAdded,
}) => {
  const initialPatient = cohort.find((p) => p.ehr.patient_id === 101) || cohort[0];
  const [selectedPatientId, setSelectedPatientId] = useState<number>(initialPatient?.ehr.patient_id ?? 101);
  const [activeTab, setActiveTab] = useState<'wearable' | 'ehr' | 'presets'>('wearable');

  // Form State
  const [hrv, setHrv] = useState<number>(() => initialPatient?.latest_telemetry.hrv_mean ?? 24.5);
  const [restingHr, setRestingHr] = useState<number>(() => initialPatient?.latest_telemetry.resting_hr_mean ?? 84);
  const [sleepHours, setSleepHours] = useState<number>(() => initialPatient?.latest_telemetry.sleep_hours ?? 4.8);
  const [sleepEfficiency, setSleepEfficiency] = useState<number>(() => initialPatient?.latest_telemetry.sleep_efficiency ?? 0.64);
  const [steps, setSteps] = useState<number>(() => Math.round(initialPatient?.latest_telemetry.daily_steps ?? 2400));

  const [systolicBp, setSystolicBp] = useState<number>(() => initialPatient?.ehr.systolic_bp ?? 152);
  const [diastolicBp, setDiastolicBp] = useState<number>(() => initialPatient?.ehr.diastolic_bp ?? 96);
  const [cholesterol, setCholesterol] = useState<number>(() => initialPatient?.ehr.cholesterol ?? 235);
  const [glucose, setGlucose] = useState<number>(() => initialPatient?.ehr.fasting_glucose ?? 128);

  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inferenceMessage, setInferenceMessage] = useState('');

  const currentPatient = cohort.find((p) => p.ehr.patient_id === selectedPatientId) || cohort[0];

  const setFormFromPatient = (patient: PatientProfile) => {
    setHrv(patient.latest_telemetry.hrv_mean);
    setRestingHr(patient.latest_telemetry.resting_hr_mean);
    setSleepHours(patient.latest_telemetry.sleep_hours);
    setSleepEfficiency(patient.latest_telemetry.sleep_efficiency);
    setSteps(Math.round(patient.latest_telemetry.daily_steps));
    setSystolicBp(patient.ehr.systolic_bp);
    setDiastolicBp(patient.ehr.diastolic_bp);
    setCholesterol(patient.ehr.cholesterol);
    setGlucose(patient.ehr.fasting_glucose);
  };

  const handlePatientChange = (patientId: number) => {
    setSelectedPatientId(patientId);
    const patient = cohort.find((p) => p.ehr.patient_id === patientId);
    if (patient) setFormFromPatient(patient);
  };

  if (!isOpen) return null;

  // Quick Presets
  const applyPreset = (type: 'safe' | 'strain' | 'crisis') => {
    if (type === 'safe') {
      setHrv(52.0);
      setRestingHr(62);
      setSleepHours(7.5);
      setSleepEfficiency(0.90);
      setSteps(8500);
      setSystolicBp(118);
      setDiastolicBp(76);
      setCholesterol(175);
      setGlucose(92);
    } else if (type === 'strain') {
      setHrv(32.0);
      setRestingHr(76);
      setSleepHours(5.6);
      setSleepEfficiency(0.72);
      setSteps(4500);
      setSystolicBp(136);
      setDiastolicBp(86);
      setCholesterol(210);
      setGlucose(115);
    } else {
      setHrv(18.5);
      setRestingHr(89);
      setSleepHours(3.8);
      setSleepEfficiency(0.52);
      setSteps(1600);
      setSystolicBp(165);
      setDiastolicBp(102);
      setCholesterol(250);
      setGlucose(145);
    }
  };

  // Simulate Apple Watch / Fitbit Live Sync
  const handleWearableSync = () => {
    setIsSimulatingSync(true);
    setSyncSuccess(false);

    setTimeout(() => {
      // Generate randomized realistic biometric stream
      const synHrv = Number((22 + Math.random() * 8).toFixed(1));
      const synRhr = Math.round(82 + Math.random() * 8);
      const synSleep = Number((4.2 + Math.random() * 1.5).toFixed(1));
      const synSteps = Math.round(1800 + Math.random() * 1200);

      setHrv(synHrv);
      setRestingHr(synRhr);
      setSleepHours(synSleep);
      setSleepEfficiency(0.62);
      setSteps(synSteps);

      setIsSimulatingSync(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  // Submit and run inference
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setInferenceMessage('');

    const baseline = currentPatient.telemetry_series[0] ?? currentPatient.latest_telemetry;
    const activityScore = Math.min(100, (steps / 8500) * 60 + sleepEfficiency * 40);
    const hrvDrop = baseline.hrv_mean - hrv;
    const restingHrRise = restingHr - baseline.resting_hr_mean;
    const sleepDrop = baseline.sleep_hours - sleepHours;
    const stepDrop = baseline.daily_steps - steps;

    const localEvaluation = evaluateRiskScore({
      age: currentPatient.ehr.age,
      sex: currentPatient.ehr.sex === 'M' ? 1 : 0,
      bmi: currentPatient.ehr.bmi,
      systolic_bp: systolicBp,
      diastolic_bp: diastolicBp,
      cholesterol: cholesterol,
      family_history: currentPatient.ehr.family_history,
      smoker: currentPatient.ehr.smoker,
      diabetes: currentPatient.ehr.diabetes,
      hrv_mean: hrv,
      resting_hr_mean: restingHr,
      sleep_hours: sleepHours,
      sleep_efficiency: sleepEfficiency,
      daily_steps: steps,
      hrv_drop_from_baseline: hrvDrop,
      resting_hr_rise_from_baseline: restingHrRise,
    });

    let evaluation = localEvaluation;
    try {
      const response = await fetch('/api/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: currentPatient.ehr.age,
          sex: currentPatient.ehr.sex === 'M' ? 1 : 0,
          bmi: currentPatient.ehr.bmi,
          systolic_bp: systolicBp,
          diastolic_bp: diastolicBp,
          cholesterol,
          family_history: currentPatient.ehr.family_history,
          smoker: currentPatient.ehr.smoker,
          diabetes: currentPatient.ehr.diabetes,
          hrv_mean: hrv,
          resting_hr_mean: restingHr,
          mean_hr: restingHr + 9,
          sleep_hours: sleepHours,
          sleep_efficiency: sleepEfficiency,
          daily_steps: steps,
          activity_score: activityScore,
          hrv_drop_from_baseline: hrvDrop,
          sleep_drop_from_baseline: sleepDrop,
          step_drop_from_baseline: stepDrop,
          resting_hr_rise_from_baseline: restingHrRise,
        }),
      });
      if (!response.ok) throw new Error('Backend inference failed');
      const result: { risk_score: number; state: typeof localEvaluation.state } = await response.json();
      evaluation = { ...localEvaluation, score: result.risk_score, state: result.state };
    } catch {
      setInferenceMessage('Backend unavailable; saved using the local risk estimate.');
    } finally {
      setIsSubmitting(false);
    }

    const newDayIndex = currentPatient.telemetry_series.length + 1;
    const newDayRecord: DayTelemetry = {
      patient_id: currentPatient.ehr.patient_id,
      day_index: newDayIndex,
      hrv_mean: hrv,
      resting_hr_mean: restingHr,
      mean_hr: restingHr + 9,
      sleep_hours: sleepHours,
      sleep_efficiency: sleepEfficiency,
      daily_steps: steps,
      activity_score: activityScore,
      risk_event_next_24h: evaluation.state === 'decompensation' ? 1 : 0,
      risk_score: evaluation.score,
      state: evaluation.state,
      hrv_drop_from_baseline: hrvDrop,
      resting_hr_rise_from_baseline: restingHrRise,
      sleep_drop_from_baseline: sleepDrop,
      step_drop_from_baseline: stepDrop,
    };

    const updatedProfile: PatientProfile = {
      ...currentPatient,
      ehr: {
        ...currentPatient.ehr,
        systolic_bp: systolicBp,
        diastolic_bp: diastolicBp,
        cholesterol: cholesterol,
        fasting_glucose: glucose,
      },
      current_day: newDayIndex,
      latest_telemetry: newDayRecord,
      telemetry_series: [...currentPatient.telemetry_series, newDayRecord],
    };

    setFormFromPatient(updatedProfile);
    onRecordAdded(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-[#131B2E] border border-[#323D57] rounded-[4px] shadow-none flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0A0E18] border-b border-[#323D57]">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold font-sans uppercase tracking-wider text-[#F2F4F6]">
              MULTI-MODAL DATA INTAKE // APPEND BIOMETRIC RECORD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#9EA4B5] hover:text-[#F2F4F6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#9EA4B5] mb-1">
              TARGET PATIENT TWIN
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(Number(e.target.value))}
              className="w-full bg-[#0A0E18] border border-[#323D57] px-3 py-2 rounded-[2px] text-xs font-mono text-[#F2F4F6] focus:border-[#7C839B] focus:outline-none"
            >
              {cohort.map((p) => (
                <option key={p.ehr.patient_id} value={p.ehr.patient_id}>
                  PT-{p.ehr.patient_id} // {p.ehr.name} ({p.ehr.age}{p.ehr.sex} - {p.ehr.diagnosis})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-[#0A0E18] p-2.5 rounded-[2px] border border-[#323D57]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9EA4B5] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                1-CLICK CLINICAL TEST PRESETS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('safe')}
                className="py-1 px-2 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono rounded-[2px] flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Normal Baseline
              </button>
              <button
                type="button"
                onClick={() => applyPreset('strain')}
                className="py-1 px-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-[10px] font-mono rounded-[2px] flex items-center justify-center gap-1"
              >
                <Activity className="w-3 h-3 text-amber-400" />
                Autonomic Strain
              </button>
              <button
                type="button"
                onClick={() => applyPreset('crisis')}
                className="py-1 px-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-[10px] font-mono rounded-[2px] flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Decompensation Horizon
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#323D57] font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('wearable')}
              className={`py-2 px-4 border-b-2 font-semibold flex items-center gap-1.5 ${
                activeTab === 'wearable'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#9EA4B5] hover:text-[#F2F4F6]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              DYNAMIC WEARABLE TELEMETRY
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ehr')}
              className={`py-2 px-4 border-b-2 font-semibold flex items-center gap-1.5 ${
                activeTab === 'ehr'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#9EA4B5] hover:text-[#F2F4F6]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              STATIC EHR & LAB VITALS
            </button>
          </div>

          {/* Tab 1: Wearable Telemetry Fields */}
          {activeTab === 'wearable' && (
            <div className="space-y-3">
              {/* Wearable Sync Simulator Button */}
              <div className="flex items-center justify-between p-2.5 bg-[#161E31] rounded-[2px] border border-[#323D57]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-[#F2F4F6]">
                    LIVE WEARABLE TELEMETRY SYNC
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleWearableSync}
                  disabled={isSimulatingSync}
                  className="px-2.5 py-1 bg-[#0A0E18] hover:bg-[#1F2937] border border-[#323D57] rounded-[2px] text-[10px] font-mono text-[#F2F4F6] flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSimulatingSync ? 'animate-spin' : ''}`} />
                  {isSimulatingSync ? 'STREAMING...' : 'SYNC FROM BLE DEVICE'}
                </button>
              </div>

              {syncSuccess && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-[2px] text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Telemetry stream synchronized successfully from CardioTwin BioPatch BLE.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    HRV / RMSSD (ms)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={hrv}
                    onChange={(e) => setHrv(parseFloat(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                  <span className="text-[9px] text-[#9EA4B5]">Homeostasis ref: &gt;45 ms</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    RESTING HEART RATE (bpm)
                  </label>
                  <input
                    type="number"
                    value={restingHr}
                    onChange={(e) => setRestingHr(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                  <span className="text-[9px] text-[#9EA4B5]">Homeostasis ref: 60–75 bpm</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    SLEEP DURATION (hours)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                  <span className="text-[9px] text-[#9EA4B5]">Target: 7.0–8.5 hrs</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    SLEEP EFFICIENCY (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={sleepEfficiency}
                    onChange={(e) => setSleepEfficiency(parseFloat(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                  <span className="text-[9px] text-[#9EA4B5]">Normal: &gt;0.85 (85%)</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    DAILY STEPS
                  </label>
                  <input
                    type="number"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: EHR & Lab Fields */}
          {activeTab === 'ehr' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    SYSTOLIC BLOOD PRESSURE (mmHg)
                  </label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    DIASTOLIC BLOOD PRESSURE (mmHg)
                  </label>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    TOTAL CHOLESTEROL (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={cholesterol}
                    onChange={(e) => setCholesterol(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
                    FASTING BLOOD GLUCOSE (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(parseInt(e.target.value))}
                    className="w-full bg-[#0A0E18] border border-[#323D57] px-2.5 py-1.5 rounded-[2px] text-[#F2F4F6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#323D57]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#161E31] hover:bg-[#1C263D] text-[#9EA4B5] hover:text-[#F2F4F6] border border-[#323D57] rounded-[2px] text-xs font-mono"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 shadow-none transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'RUNNING MODEL…' : 'SAVE & RUN DIGITAL TWIN INFERENCE'}</span>
            </button>
          </div>
          {inferenceMessage && (
            <p role="status" className="text-[10px] font-mono text-amber-300 text-right">
              {inferenceMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
