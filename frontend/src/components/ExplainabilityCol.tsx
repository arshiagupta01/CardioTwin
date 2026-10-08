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
          <h3 className="text-xs uppercase font-bold tracking-wider text-[#F2F4F6]">
            MODEL OUTPUT & CLINICAL DECISION SUPPORT
          </h3>
        </div>
        <span className={`text-[10px] font-mono ${modelConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
          {modelConnected ? `BACKEND RANDOM FOREST${modelAuc === null ? '' : ` · AUC ${modelAuc.toFixed(3)}`}` : 'DEMO SCORES · API OFFLINE'}
        </span>
      </div>

      {/* Global model feature importance */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
            GLOBAL MODEL FEATURE IMPORTANCE
          </div>
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
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            "WHAT-IF" COUNTERFACTUAL INTERVENTION SANDBOX
          </div>
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
              <span className="text-[#9EA4B5]">TARGET HRV (RMSSD):</span>
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
              <span className="text-[#9EA4B5]">TARGET RESTING HR:</span>
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
              <span className="text-[#9EA4B5]">TARGET SYSTOLIC BP:</span>
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
              <span className="text-[#9EA4B5]">TARGET SLEEP DURATION:</span>
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
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">MODEL 24H RISK</div>
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
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-1">
          CLINICAL ACTION PROTOCOLS (1-CLICK CDS)
        </div>

        {/* Primary Report Export Button */}
        {onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="w-full py-2 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all border border-emerald-400/30 shadow-sm active:scale-[0.99]"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>EXPORT CLINICAL REPORT (PDF / PRINT)</span>
          </button>
        )}

        <button
          onClick={onTriggerCall}
          className="w-full py-2 px-3 bg-red-900/60 hover:bg-red-800/70 text-red-100 border border-red-500/60 rounded-[2px] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <PhoneCall className="w-3.5 h-3.5 text-red-300" />
          <span>TRIGGER PATIENT CALL & TRIAGE</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOrderStat}
            className="py-1.5 px-2 bg-[#161E31] hover:bg-[#1C263D] text-[#F2F4F6] border border-[#323D57] rounded-[2px] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Stethoscope className="w-3 h-3 text-amber-400" />
            <span>ORDER STAT LAB/ECG</span>
          </button>

          <button
            onClick={onExportFhir}
            className="py-1.5 px-2 bg-[#161E31] hover:bg-[#1C263D] text-[#F2F4F6] border border-[#323D57] rounded-[2px] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3 text-sky-400" />
            <span>EXPORT HL7 FHIR</span>
          </button>
        </div>

        {/* Suggested Clinical Checklist */}
        <div className="mt-2 pt-2 border-t border-[#323D57]/60">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-1.5">
            SUGGESTED CLINICAL PROTOCOL (AHA/ACC)
          </div>
          <div className="space-y-1 text-[11px] text-[#9EA4B5] font-sans">
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
              <input type="checkbox" defaultChecked className="accent-emerald-500 rounded-sm" />
              <span>STAT Troponin-I & NT-proBNP draw</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
              <input type="checkbox" defaultChecked className="accent-emerald-500 rounded-sm" />
              <span>12-Lead ECG for ischemic conduction changes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
              <input type="checkbox" className="accent-emerald-500 rounded-sm" />
              <span>Telehealth nurse vitals verification</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-[#F2F4F6]">
              <input type="checkbox" className="accent-emerald-500 rounded-sm" />
              <span>Optimize neurohormonal blockade regimen</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
