import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types/clinical';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, HeartPulse, ChevronRight, ChevronLeft, Zap, FileText, Info } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';
import { ClinicalTooltip } from './ClinicalTooltip';

interface PatientBannerProps {
  patient: PatientProfile;
  activeDay: number;
  onDayChange: (day: number) => void;
  modelConnected: boolean;
  onOpenReportModal?: () => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  activeDay,
  onDayChange,
  modelConnected,
  onOpenReportModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTelemetry = patient.telemetry_series.find((d) => d.day_index === activeDay) || patient.latest_telemetry;
  const baseline = patient.telemetry_series[0] ?? currentTelemetry;

  const hrvDelta = currentTelemetry.hrv_mean - baseline.hrv_mean;
  const rhrDelta = currentTelemetry.resting_hr_mean - baseline.resting_hr_mean;

  const totalDays = Math.max(1, patient.telemetry_series.length || 10);

  // Auto-play degradation progression
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        onDayChange(activeDay >= totalDays ? 1 : activeDay + 1);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeDay, onDayChange, totalDays]);

  const riskPercent = (currentTelemetry.risk_score * 100).toFixed(1);
  const isDecomp = currentTelemetry.state === 'decompensation';
  const isStrain = currentTelemetry.state === 'strain';

  const stateTheme = isDecomp
    ? {
        bg: 'bg-red-950/40',
        border: 'border-red-500/40',
        text: 'text-red-700 dark:text-red-400',
        chipBg: 'bg-[#FFDAD6] text-[#93000A] dark:bg-[#7F1D1D]/50 dark:text-[#F87171] dark:border-[#DC2626]/40',
        label: 'ACUTE RISK STATE (24H MODEL)',
        icon: AlertTriangle,
        summary: `CRITICAL ALERT: Patient ${patient.ehr.name} exhibits severe cardiovascular decompensation risk (${riskPercent}%). Biomarkers indicate acute vagal withdrawal (${hrvDelta.toFixed(1)} ms HRV drop from baseline) and compensatory tachycardia (+${rhrDelta.toFixed(1)} bpm resting HR). Recommended: STAT Troponin/BNP and immediate clinical evaluation.`,
      }
    : isStrain
    ? {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/40',
        text: 'text-amber-800 dark:text-amber-400',
        chipBg: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/50 dark:text-[#FBBF24] dark:border-[#D97706]/40',
        label: 'AUTONOMIC STRAIN DETECTED',
        icon: AlertTriangle,
        summary: `EARLY WARNING: Autonomic strain detected (${riskPercent}% risk). Continuous wearable feeds capture deteriorating sleep efficiency and early sympathetic surge prior to symptomatic cardiac failure. Recommended: Telehealth check-in and medication adherence review.`,
      }
    : {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        chipBg: 'bg-[#D1FAE5] text-[#069669] dark:bg-[#064E3B]/50 dark:text-[#34D399] dark:border-[#059669]/40',
        label: 'PHYSIOLOGIC HOMEOSTASIS STABLE',
        icon: ShieldCheck,
        summary: `STABLE STATUS: Patient biomarkers remain within expected homeostatic baseline boundaries (${riskPercent}% event risk). No acute neurohormonal decompensation signal detected over the active 24-48h horizon.`,
      };

  const StateIcon = stateTheme.icon;

  return (
    <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 mb-3 flex flex-col gap-3">
      {/* Top Row: Demographics, State Chip, Risk Gauge & Report Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Patient Identity */}
        <div className="flex items-center gap-3">
          <PatientAvatar patientId={patient.ehr.patient_id} name={patient.ehr.name} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-[#F2F4F6] font-sans">
                {patient.ehr.name}
              </h2>
              <span className="font-mono text-xs text-[#9EA4B5] px-1.5 py-0.5 bg-[#161E31] rounded-[2px] border border-[#323D57]/60">
                {patient.ehr.age}{patient.ehr.sex} • BMI {patient.ehr.bmi}
              </span>
            </div>
            <p className="text-xs text-[#9EA4B5] mt-0.5 font-sans">
              <strong className="text-[#F2F4F6]">PRIMARY DIAGNOSIS:</strong> {patient.ehr.diagnosis}
            </p>
          </div>
        </div>

        {/* Dynamic Twin State Pill & Risk Probability Meter & Export Action */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Twin State Pill with Tooltip */}
          <ClinicalTooltip
            term={stateTheme.label}
            definition="Clinical risk classification predicted by the AI model based on continuous biometric divergence."
            clinicalSignificance="Decompensation indicates acute pump or vascular breakdown. Strain indicates early autonomic warning."
          >
            <div className={`px-2.5 py-1 rounded-[12px] border text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider ${stateTheme.chipBg}`}>
              <StateIcon className="w-3.5 h-3.5" />
              {stateTheme.label}
            </div>
          </ClinicalTooltip>

          {/* High-Consequence 24-48h Event Probability */}
          <div className="flex items-center gap-3 pl-3 border-l border-[#323D57]">
            <div className="text-right">
              <ClinicalTooltip
                term="24H MODEL RISK"
                definition="Probability that this patient will experience an acute cardiovascular decompensation requiring hospital admission in the next 24-48 hours."
                normalRange="< 25% (Homeostasis)"
              >
                <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5] font-semibold">
                  24H MODEL RISK
                </div>
              </ClinicalTooltip>
              <div className={`text-2xl font-bold font-mono tracking-tight leading-none ${stateTheme.text}`}>
                {riskPercent}%
              </div>
              <div className={`text-[8px] uppercase font-mono ${modelConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {modelConnected ? 'BACKEND MODEL' : 'DEMO SCORES'}
              </div>
            </div>

            {/* Circular Gauge Meter */}
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#161E31]"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeWidth="3.2"
                  strokeDasharray={`${currentTelemetry.risk_score * 100}, 100`}
                  strokeLinecap="round"
                  stroke={isDecomp ? '#F87171' : isStrain ? '#FBBF24' : '#34D399'}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <HeartPulse className={`w-4 h-4 absolute ${stateTheme.text} ${isDecomp ? 'animate-bounce' : ''}`} />
            </div>

            {/* Direct Clinical Report Export Trigger */}
            {onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="ml-2 px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-[2px] font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-emerald-400/30 shadow-sm"
                title="Generate printable PDF consultation report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">EXPORT REPORT (PDF)</span>
                <span className="md:hidden">PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Second AI Clinical Assessment Narrative Banner */}
      <div className={`p-2.5 rounded-[2px] border text-xs font-sans leading-relaxed flex items-start gap-2.5 ${isDecomp ? 'bg-red-950/30 border-red-500/40 text-red-200' : isStrain ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'}`}>
        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDecomp ? 'text-red-400' : isStrain ? 'text-amber-400' : 'text-emerald-400'}`} />
        <div className="flex-1">
          <strong className="font-mono text-[10px] uppercase tracking-wider block font-bold mb-0.5 opacity-90">
            AI CLINICAL NARRATIVE ASSESSMENT // 3-SECOND TRIAGE SUMMARY
          </strong>
          <span>{stateTheme.summary}</span>
        </div>
      </div>


      {/* Bottom Row: 10-Day Longitudinal Timeline Scrubber with Auto-Play */}
      <div className="bg-[#0A0E18] rounded-[2px] border border-[#323D57] p-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Scrubber Controls */}
        <div className="flex items-center gap-2">
          <ClinicalTooltip
            term="5-DAY DEGRADATION CASCADE"
            definition="Auto-plays the longitudinal trajectory showing autonomic deterioration from healthy baseline to acute decompensation."
            clinicalSignificance="Visualizes the compounding biometric drift (vagal withdrawal, compensatory tachycardia) leading up to an event."
            hideIcon={true}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2.5 py-1 rounded-[2px] border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-[#131B2E] border-[#323D57] text-[#F2F4F6] hover:bg-[#161E31]'
              }`}
            >
              {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
              {isPlaying ? 'PAUSE CASCADE' : 'PLAY 5-DAY CASCADE'}
            </button>
          </ClinicalTooltip>

          <button
            onClick={() => onDayChange(1)}
            className="p-1 rounded-[2px] border border-[#323D57] bg-[#131B2E] text-[#9EA4B5] hover:text-[#F2F4F6]"
            title="Reset to Day 1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-1 font-mono text-[10px] text-[#9EA4B5] pl-2 border-l border-[#323D57]">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>TIMELINE HORIZON:</span>
            <strong className="text-[#F2F4F6]">DAY {activeDay} OF {totalDays}</strong>
          </div>
        </div>

        {/* Dynamic Longitudinal Interactive Stepper */}
        <div className="flex items-center gap-1 flex-1 max-w-lg">
          <button
            onClick={() => onDayChange(Math.max(1, activeDay - 1))}
            className="p-1 text-[#9EA4B5] hover:text-[#F2F4F6]"
            disabled={activeDay <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="gap-1 flex-1 grid"
            style={{ gridTemplateColumns: `repeat(${Math.min(12, totalDays)}, minmax(0, 1fr))` }}
          >
            {patient.telemetry_series.map((d) => {
              const isCurrent = d.day_index === activeDay;
              const dayColor = d.state === 'decompensation' ? 'bg-red-500' : d.state === 'strain' ? 'bg-amber-400' : 'bg-emerald-400';

              return (
                <button
                  key={d.day_index}
                  onClick={() => onDayChange(d.day_index)}
                  className={`py-1 px-0.5 rounded-[2px] border text-center transition-all flex flex-col items-center gap-0.5 ${
                    isCurrent
                      ? 'border-[#7C839B] bg-[#161E31] text-[#F2F4F6] font-bold ring-1 ring-[#7C839B]'
                      : 'border-[#323D57]/60 bg-[#0A0E18] text-[#9EA4B5] hover:border-[#7C839B]'
                  }`}
                >
                  <span className="text-[9px] font-mono leading-none">D{d.day_index}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${dayColor}`} />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onDayChange(Math.min(totalDays, activeDay + 1))}
            className="p-1 text-[#9EA4B5] hover:text-[#F2F4F6]"
            disabled={activeDay >= totalDays}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
