import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types/clinical';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, HeartPulse, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';

interface PatientBannerProps {
  patient: PatientProfile;
  activeDay: number;
  onDayChange: (day: number) => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  activeDay,
  onDayChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTelemetry = patient.telemetry_series.find((d) => d.day_index === activeDay) || patient.latest_telemetry;

  // Auto-play degradation progression
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        onDayChange(activeDay >= 10 ? 1 : activeDay + 1);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeDay, onDayChange]);

  const riskPercent = (currentTelemetry.risk_score * 100).toFixed(1);
  const isDecomp = currentTelemetry.state === 'decompensation';
  const isStrain = currentTelemetry.state === 'strain';

  const stateTheme = isDecomp
    ? {
        bg: 'bg-red-950/40',
        border: 'border-red-500/40',
        text: 'text-red-700 dark:text-red-400',
        chipBg: 'bg-[#FFDAD6] text-[#93000A] dark:bg-[#7F1D1D]/50 dark:text-[#F87171] dark:border-[#DC2626]/40',
        label: 'ACUTE DECOMPENSATION HORIZON (24–48H)',
        icon: AlertTriangle,
      }
    : isStrain
    ? {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/40',
        text: 'text-amber-800 dark:text-amber-400',
        chipBg: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/50 dark:text-[#FBBF24] dark:border-[#D97706]/40',
        label: 'AUTONOMIC STRAIN DETECTED',
        icon: AlertTriangle,
      }
    : {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        chipBg: 'bg-[#D1FAE5] text-[#069669] dark:bg-[#064E3B]/50 dark:text-[#34D399] dark:border-[#059669]/40',
        label: 'PHYSIOLOGIC HOMEOSTASIS STABLE',
        icon: ShieldCheck,
      };

  const StateIcon = stateTheme.icon;

  return (
    <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 mb-3 flex flex-col gap-3">
      {/* Top Row: Demographics, State Chip, and High-Consequence Risk Gauge */}
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

        {/* Dynamic Twin State Pill & Risk Probability Meter */}
        <div className="flex items-center gap-4">
          {/* Twin State Pill */}
          <div className={`px-2.5 py-1 rounded-[12px] border text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider ${stateTheme.chipBg}`}>
            <StateIcon className="w-3.5 h-3.5" />
            {stateTheme.label}
          </div>

          {/* High-Consequence 24-48h Event Probability */}
          <div className="flex items-center gap-3 pl-3 border-l border-[#323D57]">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5] font-semibold">
                24–48h EVENT PROBABILITY
              </div>
              <div className={`text-2xl font-bold font-mono tracking-tight leading-none ${stateTheme.text}`}>
                {riskPercent}%
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
          </div>
        </div>
      </div>

      {/* Bottom Row: 10-Day Longitudinal Timeline Scrubber with Auto-Play */}
      <div className="bg-[#0A0E18] rounded-[2px] border border-[#323D57] p-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Scrubber Controls */}
        <div className="flex items-center gap-2">
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
            <strong className="text-[#F2F4F6]">DAY {activeDay} OF 10</strong>
          </div>
        </div>

        {/* 10-Day Interactive Stepper */}
        <div className="flex items-center gap-1 flex-1 max-w-lg">
          <button
            onClick={() => onDayChange(Math.max(1, activeDay - 1))}
            className="p-1 text-[#9EA4B5] hover:text-[#F2F4F6]"
            disabled={activeDay <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-10 gap-1 flex-1">
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
            onClick={() => onDayChange(Math.min(10, activeDay + 1))}
            className="p-1 text-[#9EA4B5] hover:text-[#F2F4F6]"
            disabled={activeDay >= 10}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
