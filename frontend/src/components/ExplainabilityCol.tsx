import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types/clinical';
import { fetchModelImportance, ModelImportance, predictRisk, toModelFeatures, ModelPrediction } from '../data/riskApi';
import { Cpu, Sliders, PhoneCall, Stethoscope, Download, ArrowRight, Check, AlertCircle, Wifi, WifiOff, FileText, CheckSquare, Square } from 'lucide-react';
import { ClinicalTooltip } from './ClinicalTooltip';

interface ExplainabilityColProps {
  patient: PatientProfile;
  modelConnected: boolean;
  onTriggerCall: () => void;
  onOrderStat: () => void;
  onExportFhir: () => void;
  onOpenReportModal?: () => void;
}

export const ExplainabilityCol: React.FC<ExplainabilityColProps> = ({
  patient,
  modelConnected,
  onTriggerCall,
  onOrderStat,
  onExportFhir,
  onOpenReportModal,
}) => {

  // Counterfactual What-If Intervention Sandbox State
  const latest = patient.latest_telemetry;
  const [targetHrv, setTargetHrv] = useState(latest.hrv_mean);
  const [targetRhr, setTargetRhr] = useState(latest.resting_hr_mean);
  const [targetSleep, setTargetSleep] = useState(latest.sleep_hours);
  const [targetSbp, setTargetSbp] = useState(patient.ehr.systolic_bp);

  const [simPrediction, setSimPrediction] = useState<ModelPrediction | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(false);
  const [importance, setImportance] = useState<ModelImportance[]>([]);
  const [modelAuc, setModelAuc] = useState<number | null>(null);

  useEffect(() => {
    setTargetHrv(latest.hrv_mean);
    setTargetRhr(latest.resting_hr_mean);
    setTargetSleep(latest.sleep_hours);
    setTargetSbp(patient.ehr.systolic_bp);
  }, [patient.ehr.patient_id, latest.day_index]);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const loadImportance = async (attempt = 0) => {
      try {
        const result = await fetchModelImportance();
        if (cancelled) return;
        setImportance(result.features);
        setModelAuc(result.roc_auc);
      } catch {
        if (cancelled) return;
        if (attempt < 5) retryTimer = setTimeout(() => void loadImportance(attempt + 1), 1500);
      }
    };
    void loadImportance();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setSimLoading(true);
    setSimError(false);
    setSimPrediction(null);
    const timer = setTimeout(() => {
      predictRisk({
        ...toModelFeatures(patient, latest, targetSbp),
        hrv_mean: targetHrv,
        resting_hr_mean: targetRhr,
        sleep_hours: targetSleep,
        hrv_drop_from_baseline: (patient.telemetry_series[0]?.hrv_mean ?? targetHrv) - targetHrv,
        resting_hr_rise_from_baseline: targetRhr - (patient.telemetry_series[0]?.resting_hr_mean ?? targetRhr),
        sleep_drop_from_baseline: (patient.telemetry_series[0]?.sleep_hours ?? targetSleep) - targetSleep,
      }, controller.signal)
        .then(setSimPrediction)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setSimError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSimLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [patient, latest, targetHrv, targetRhr, targetSleep, targetSbp]);

  const simRiskPercent = simPrediction ? (simPrediction.risk_score * 100).toFixed(1) : '—';
  const currentRiskPercent = (latest.risk_score * 100).toFixed(1);
  const deltaRisk = simPrediction ? (simPrediction.risk_score - latest.risk_score) * 100 : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#323D57] pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <ClinicalTooltip
            term="MODEL OUTPUT & CLINICAL DECISION SUPPORT"
            definition="AI ensemble analyzing continuous wearable biomarker divergence and baseline EHR to predict cardiac events 24-48h in advance."
            clinicalSignificance="Flags acute decompensation early so clinicians can intervene before emergency hospitalization."
            hideIcon={false}
          >
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#F2F4F6]">
              MODEL OUTPUT & CLINICAL DECISION SUPPORT
            </h3>
          </ClinicalTooltip>
        </div>
        <span className={`text-[10px] font-mono ${modelConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
          {modelConnected ? `BACKEND RANDOM FOREST${modelAuc === null ? '' : ` · AUC ${modelAuc.toFixed(3)}`}` : 'DEMO SCORES · API OFFLINE'}
        </span>
      </div>

      {/* Global model feature importance */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <ClinicalTooltip
            term="GLOBAL MODEL FEATURE IMPORTANCE"
            definition="The mathematical weight and contribution of each biomarker to reducing impurity across decision trees."
            clinicalSignificance="Highlights which physiological features (e.g. HRV drop, Resting HR rise) drive the AI's risk predictions."
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
              GLOBAL MODEL FEATURE IMPORTANCE
            </div>
          </ClinicalTooltip>
          <span className="text-[9px] font-mono text-[#9EA4B5]">RANDOM FOREST SPLITS</span>
        </div>

        <div className="space-y-2 mt-1">
          {importance.slice(0, 6).map((driver, idx) => {
            const label = driver.feature.replaceAll('_', ' ');
            return (
              <div key={driver.feature} className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#F2F4F6] truncate pr-2">
                    {label}
                  </span>
                  <span className="font-bold shrink-0 text-sky-300">
                    {(driver.importance * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Contribution visual bar */}
                <div className="w-full h-1.5 bg-[#0A0E18] rounded-[2px] overflow-hidden mb-1">
                  <div
                    className="h-full rounded-[1px] bg-sky-500"
                    style={{ width: `${Math.min(100, driver.importance * 500)}%` }}
                  />
                </div>

                <div className="text-[9px] text-[#9EA4B5] font-sans italic">
                  Global contribution to tree impurity reduction; does not show this patient’s direction of effect.
                </div>
              </div>
            );
          })}
          {importance.length === 0 && <div className="text-[10px] text-amber-400">Model importance unavailable while backend is offline.</div>}
        </div>
      </div>

      {/* Interactive "What-If" Counterfactual Simulation Sandbox */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#323D57]/60">
          <ClinicalTooltip
            term="COUNTERFACTUAL INTERVENTION SANDBOX"
            definition="In silico simulation allowing doctors to test the impact of pharmacological or lifestyle treatments on the digital twin."
            clinicalSignificance="Enables predictive evaluation of expected risk reduction before prescribing therapies."
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-300">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              "WHAT-IF" COUNTERFACTUAL INTERVENTION SANDBOX
            </div>
          </ClinicalTooltip>
          <span className="text-[9px] font-mono bg-amber-950/60 text-amber-300 px-1.5 py-0.2 border border-amber-500/40 rounded-[2px]">
            BACKEND INFERENCE
          </span>
        </div>

        <p className="text-[10px] text-[#9EA4B5] mb-2 font-sans">
          Adjust clinical intervention targets below to test expected reduction in 24–48h acute risk.
        </p>

        {/* Sliders Grid */}
        <div className="space-y-2.5 font-mono text-[10px]">
          {/* Target HRV */}
          <div>
            <div className="flex justify-between mb-0.5">
              <ClinicalTooltip
                term="TARGET HRV (RMSSD)"
                definition="Root Mean Square of Successive RR interval differences. Measures parasympathetic (vagal) autonomic regulation."
                normalRange="35 - 65 ms"
                clinicalSignificance="Higher HRV reflects healthy vagal tone; acute drops indicate impending cardiac decompensation."
              >
                <span className="text-[#9EA4B5]">TARGET HRV (RMSSD):</span>
              </ClinicalTooltip>
              <strong className="text-emerald-400">{targetHrv.toFixed(1)} ms</strong>
            </div>
            <input
              type="range"
              min="15"
              max="65"
              step="1"
              value={targetHrv}
              onChange={(e) => setTargetHrv(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-[#0A0E18] rounded-[2px] cursor-pointer"
            />
          </div>

          {/* Target Resting HR */}
          <div>
            <div className="flex justify-between mb-0.5">
              <ClinicalTooltip
                term="TARGET RESTING HR"
                definition="Baseline heart rate during resting states without physical exertion."
                normalRange="60 - 80 bpm"
                clinicalSignificance="Elevated resting HR (>80 bpm) indicates compensatory sympathetic tachycardia as stroke volume falls."
              >
                <span className="text-[#9EA4B5]">TARGET RESTING HR:</span>
              </ClinicalTooltip>
              <strong className="text-amber-400">{targetRhr.toFixed(0)} bpm</strong>
            </div>
            <input
              type="range"
              min="55"
              max="95"
              step="1"
              value={targetRhr}
              onChange={(e) => setTargetRhr(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-[#0A0E18] rounded-[2px] cursor-pointer"
            />
          </div>

          {/* Target Systolic BP */}
          <div>
            <div className="flex justify-between mb-0.5">
              <ClinicalTooltip
                term="TARGET SYSTOLIC BP"
                definition="Peak arterial pressure during left ventricular systole."
                normalRange="100 - 120 mmHg"
                clinicalSignificance="Lowering systolic pressure reduces cardiac afterload and left ventricular wall stress."
              >
                <span className="text-[#9EA4B5]">TARGET SYSTOLIC BP:</span>
              </ClinicalTooltip>
              <strong className="text-sky-400">{targetSbp} mmHg</strong>
            </div>
            <input
              type="range"
              min="105"
              max="175"
              step="2"
              value={targetSbp}
              onChange={(e) => setTargetSbp(parseInt(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-[#0A0E18] rounded-[2px] cursor-pointer"
            />
          </div>

          {/* Target Sleep Duration */}
          <div>
            <div className="flex justify-between mb-0.5">
              <ClinicalTooltip
                term="TARGET SLEEP DURATION"
                definition="Continuous restorative nocturnal sleep hours captured by wearable biosensors."
                normalRange="7.0 - 8.5 hrs"
                clinicalSignificance="Sleep fragmentation is an early prodromal indicator of nocturnal orthopnea and paroxysmal dyspnea."
              >
                <span className="text-[#9EA4B5]">TARGET SLEEP DURATION:</span>
              </ClinicalTooltip>
              <strong className="text-indigo-400">{targetSleep.toFixed(1)} hrs</strong>
            </div>
            <input
              type="range"
              min="3.5"
              max="8.5"
              step="0.5"
              value={targetSleep}
              onChange={(e) => setTargetSleep(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-[#0A0E18] rounded-[2px] cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Simulation Result Card */}
        <div className="mt-3 p-2 bg-[#0A0E18] rounded-[2px] border border-[#323D57] flex items-center justify-between">
          <div>
            <ClinicalTooltip
              term="MODEL 24H SIMULATED RISK"
              definition="Predicted acute event probability under the simulated counterfactual targets."
              clinicalSignificance="Demonstrates how clinical interventions shift the patient toward homeostatic stability."
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">MODEL 24H RISK</div>
            </ClinicalTooltip>
            {simError && <div className="text-[9px] text-amber-400">Backend inference unavailable</div>}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-[#F2F4F6]">
                {simLoading ? 'SCORING…' : `${simRiskPercent}${simPrediction ? '%' : ''}`}
              </span>
              {deltaRisk !== null && <span className={`text-[10px] font-mono font-bold ${deltaRisk < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltaRisk < 0 ? `${deltaRisk.toFixed(1)}%` : `+${deltaRisk.toFixed(1)}%`}
              </span>}
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[12px] border font-bold ${
              simPrediction?.state === 'decompensation'
                ? 'bg-red-950/60 text-red-300 border-red-500/40'
                : simPrediction?.state === 'strain'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}>
              {simLoading ? 'SCORING' : simPrediction?.state.toUpperCase() ?? 'UNAVAILABLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Decision Support Action Protocols */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 flex flex-col gap-2">
        <ClinicalTooltip
          term="CLINICAL ACTION PROTOCOLS (1-CLICK CDS)"
          definition="One-click clinical workflows enabling instant EHR documentation, diagnostic ordering, and patient triage."
          clinicalSignificance="Shortens time-to-treatment by eliminating manual clerical steps during cardiac alert episodes."
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-1">
            CLINICAL ACTION PROTOCOLS (1-CLICK CDS)
          </div>
        </ClinicalTooltip>

        {/* Primary Report Export Button */}
        {onOpenReportModal && (
          <ClinicalTooltip
            term="EXPORT CLINICAL REPORT"
            definition="Generates a hospital consultation note and chart summary with 1-click Print/PDF, progress note, and CSV export."
            clinicalSignificance="Provides documentation for shift handoffs, patient records, and cardiology consultations."
            hideIcon={true}
          >
            <button
              onClick={onOpenReportModal}
              className="w-full py-2 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all border border-emerald-400/30 shadow-sm active:scale-[0.99]"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>EXPORT CLINICAL REPORT (PDF / PRINT)</span>
            </button>
          </ClinicalTooltip>
        )}

        <ClinicalTooltip
          term="TRIGGER PATIENT CALL & TRIAGE"
          definition="Initiates immediate two-way telehealth outreach and records a structured triage note in the chart."
          clinicalSignificance="Verifies patient symptoms (orthopnea, chest pressure) within the critical 24-48h window."
          hideIcon={true}
        >
          <button
            onClick={onTriggerCall}
            className="w-full py-2 px-3 bg-red-900/60 hover:bg-red-800/70 text-red-100 border border-red-500/60 rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-300" />
            <span>TRIGGER PATIENT CALL & TRIAGE</span>
          </button>
        </ClinicalTooltip>

        <div className="grid grid-cols-2 gap-2">
          <ClinicalTooltip
            term="ORDER STAT LAB/ECG"
            definition="Direct computerized order requisition for Troponin-I, 12-lead ECG, NT-proBNP, CMP, or Holter."
            clinicalSignificance="Rapidly confirms myocardial damage and fluid overload to prevent emergency admission."
            hideIcon={true}
          >
            <button
              onClick={onOrderStat}
              className="w-full py-1.5 px-2 bg-[#161E31] hover:bg-[#1C263D] text-[#F2F4F6] border border-[#323D57] rounded-[2px] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Stethoscope className="w-3 h-3 text-amber-400" />
              <span>ORDER STAT LAB/ECG</span>
            </button>
          </ClinicalTooltip>

          <ClinicalTooltip
            term="EXPORT HL7 FHIR"
            definition="Generates standard HL7 FHIR JSON bundle with Patient, RiskAssessment (SNOMED-CT 428251008), and Observations."
            clinicalSignificance="Ensures interoperability across Epic Systems, Cerner, and national health record systems."
            hideIcon={true}
          >
            <button
              onClick={onExportFhir}
              className="w-full py-1.5 px-2 bg-[#161E31] hover:bg-[#1C263D] text-[#F2F4F6] border border-[#323D57] rounded-[2px] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3 h-3 text-sky-400" />
              <span>EXPORT HL7 FHIR</span>
            </button>
          </ClinicalTooltip>
        </div>

        {/* Suggested Clinical Checklist */}
        <div className="mt-2 pt-2 border-t border-[#323D57]/60">
          <ClinicalTooltip
            term="AHA/ACC CLINICAL PROTOCOL"
            definition="Evidence-based guidelines from the American Heart Association and American College of Cardiology for acute cardiac strain."
            clinicalSignificance="Standardizes clinical decision-making across bedside nurses and attending physicians."
          >
            <div className="text-[9px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-1.5">
              SUGGESTED CLINICAL PROTOCOL (AHA/ACC)
            </div>
          </ClinicalTooltip>
          <div className="space-y-1 text-[11px] text-[#9EA4B5] font-sans">
            <ClinicalTooltip
              term="STAT Troponin-I & NT-proBNP"
              definition="High-sensitivity markers for myocardial cell death (Troponin) and ventricular wall tension (NT-proBNP)."
              clinicalSignificance="Confirms acute myocardial injury and ventricular congestion."
              hideIcon={true}
            >
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
                <input type="checkbox" defaultChecked className="accent-emerald-500 rounded-sm" />
                <span>STAT Troponin-I & NT-proBNP draw</span>
              </label>
            </ClinicalTooltip>

            <ClinicalTooltip
              term="12-Lead Electrocardiogram"
              definition="Standard diagnostic electrical recording of cardiac polarization and repolarization across 12 anatomical leads."
              clinicalSignificance="Detects acute ST-segment changes, ischemia, and dangerous conduction delays."
              hideIcon={true}
            >
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
                <input type="checkbox" defaultChecked className="accent-emerald-500 rounded-sm" />
                <span>12-Lead ECG for ischemic conduction changes</span>
              </label>
            </ClinicalTooltip>

            <ClinicalTooltip
              term="Telehealth Vitals Verification"
              definition="Clinical outreach to verify home blood pressure, pulse, and symptoms before initiating pharmacotherapy."
              clinicalSignificance="Prevents unnecessary hospital admissions by verifying telemetry accuracy."
              hideIcon={true}
            >
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
                <input type="checkbox" className="accent-emerald-500 rounded-sm" />
                <span>Telehealth nurse vitals verification</span>
              </label>
            </ClinicalTooltip>

            <ClinicalTooltip
              term="Guideline-Directed Medical Therapy (GDMT)"
              definition="Optimizing 4-pillar neurohormonal blockade: ARNI/ACEi, beta-blockers, MRA, and SGLT2 inhibitors."
              clinicalSignificance="Reverses cardiac remodeling and drastically reduces mortality and readmission rates."
              hideIcon={true}
            >
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
                <input type="checkbox" className="accent-emerald-500 rounded-sm" />
                <span>Optimize neurohormonal blockade regimen</span>
              </label>
            </ClinicalTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
