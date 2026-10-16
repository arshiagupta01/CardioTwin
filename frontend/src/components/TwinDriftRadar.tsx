import React from 'react';
import { Compass, ShieldAlert, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PatientProfile, DayTelemetry } from '../types/clinical';
import { ClinicalTooltip } from './ClinicalTooltip';

interface TwinDriftRadarProps {
  patient: PatientProfile;
  currentTelemetry: DayTelemetry;
  liveBpm: number;
  liveHrv: number;
}

export const TwinDriftRadar: React.FC<TwinDriftRadarProps> = ({
  patient,
  currentTelemetry,
  liveBpm,
  liveHrv,
}) => {
  const baseline = patient.telemetry_series[0] ?? currentTelemetry;

  // 5 Biomarker Axis normalized scores [0..1] where 1 is healthy homeostasis, <0.4 is severe drift
  // 1. Vagal Tone: based on HRV vs baseline
  const vagalScore = Math.max(0.15, Math.min(1, liveHrv / Math.max(30, baseline.hrv_mean)));
  
  // 2. Sympathetic Stability: lower resting HR is healthier
  const rhrRatio = liveBpm / Math.max(50, baseline.resting_hr_mean);
  const sympatheticScore = Math.max(0.15, Math.min(1, 1 - (rhrRatio - 1) * 0.8));

  // 3. Sleep Efficiency & Duration
  const sleepScore = Math.max(0.2, Math.min(1, (currentTelemetry.sleep_hours / 7.5) * currentTelemetry.sleep_efficiency));

  // 4. Hemodynamics / Vascular Load: SBP & DBP vs ideal 120/80
  const bpRatio = (patient.ehr.systolic_bp + patient.ehr.diastolic_bp * 2) / (120 + 80 * 2);
  const vascularScore = Math.max(0.2, Math.min(1, 1 - (bpRatio - 1) * 0.9));

  // 5. Activity & Aerobic Reserve
  const activityScore = Math.max(0.25, Math.min(1, currentTelemetry.activity_score));

  // Radar geometry
  const size = 180;
  const center = size / 2;
  const radius = 64;

  const axes = [
    { label: 'VAGAL (HRV)', value: vagalScore, angle: -Math.PI / 2 },
    { label: 'SYMPATHETIC', value: sympatheticScore, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: 'VASCULAR', value: vascularScore, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: 'SLEEP REST', value: sleepScore, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: 'ACTIVITY', value: activityScore, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  // Helper to calculate (x, y)
  const getCoordinates = (val: number, angle: number) => {
    const r = radius * val;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Ideal Baseline Twin polygon (all values = 1.0)
  const idealPoints = axes.map((a) => {
    const { x, y } = getCoordinates(0.95, a.angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Observed Real Patient Telemetry polygon
  const observedPoints = axes.map((a) => {
    const { x, y } = getCoordinates(a.value, a.angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Overall Residual Drift Sigma (distance from homeostasis)
  const avgDriftScore = (vagalScore + sympatheticScore + vascularScore + sleepScore + activityScore) / 5;
  const residualDriftSigma = ((1 - avgDriftScore) * 3.8).toFixed(2);
  const isHighDrift = Number(residualDriftSigma) > 1.8;
  const isModerateDrift = Number(residualDriftSigma) > 1.0;

  return (
    <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-[#323D57]/60 pb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <ClinicalTooltip
            term="SHADOW TWIN RESIDUAL DRIFT RADAR"
            definition="Continuous biometric divergence metric comparing the patient's simulated ideal homeostatic digital twin against real-time wearable telemetry."
            clinicalSignificance="Quantifies multidimensional autonomic and vascular decay. A drift > 1.8 sigma flags imminent neurohormonal decompensation."
          >
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#F2F4F6]">
              DIGITAL TWIN // RESIDUAL DRIFT RADAR
            </span>
          </ClinicalTooltip>
        </div>
        <span className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] font-bold border flex items-center gap-1 ${
          isHighDrift
            ? 'bg-red-950/60 border-red-500/50 text-red-300'
            : isModerateDrift
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
        }`}>
          Δ {residualDriftSigma}σ {isHighDrift ? 'SEVERE DRIFT' : isModerateDrift ? 'STRAIN DRIFT' : 'IN HOMEOSTASIS'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
        {/* SVG 5-Axis Radar Chart */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {/* Concentric Guide Polygons (0.33, 0.66, 1.0) */}
            {[0.33, 0.66, 0.95].map((lvl) => {
              const ringPts = axes.map((a) => {
                const { x, y } = getCoordinates(lvl, a.angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return (
                <polygon
                  key={lvl}
                  points={ringPts}
                  fill="none"
                  stroke="#323D57"
                  strokeWidth="0.8"
                  strokeDasharray={lvl < 0.9 ? '2,2' : undefined}
                  opacity={0.5}
                />
              );
            })}

            {/* Axis Radial Spokes */}
            {axes.map((a, i) => {
              const { x, y } = getCoordinates(0.95, a.angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#323D57"
                  strokeWidth="0.8"
                  opacity={0.6}
                />
              );
            })}

            {/* Ideal Baseline Twin Envelope (Emerald Dotted) */}
            <polygon
              points={idealPoints}
              fill="rgba(52, 211, 153, 0.08)"
              stroke="#34D399"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />

            {/* Observed Real-Time Patient Envelope */}
            <polygon
              points={observedPoints}
              fill={isHighDrift ? 'rgba(248, 113, 113, 0.25)' : isModerateDrift ? 'rgba(251, 191, 36, 0.22)' : 'rgba(52, 211, 153, 0.25)'}
              stroke={isHighDrift ? '#F87171' : isModerateDrift ? '#FBBF24' : '#34D399'}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            {/* Data Point Markers */}
            {axes.map((a, i) => {
              const { x, y } = getCoordinates(a.value, a.angle);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill={isHighDrift ? '#F87171' : isModerateDrift ? '#FBBF24' : '#34D399'}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend & Biomarker Divergence Breakdown */}
        <div className="flex-1 w-full text-[10px] font-mono space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#323D57]/40 text-[#9EA4B5]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-dashed border-emerald-400 bg-emerald-400/20" />
              SHADOW TWIN IDEAL
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isHighDrift ? 'bg-red-400' : isModerateDrift ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              OBSERVED PATIENT
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[#9EA4B5]">Vagal (HRV) Deficit:</span>
              <span className={vagalScore < 0.5 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {((1 - vagalScore) * 100).toFixed(0)}% drop
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9EA4B5]">Sympathetic Surge:</span>
              <span className={sympatheticScore < 0.5 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                +{Math.max(0, liveBpm - baseline.resting_hr_mean)} bpm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9EA4B5]">Vascular Afterload:</span>
              <span className={vascularScore < 0.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                MAP {Math.round((patient.ehr.systolic_bp + patient.ehr.diastolic_bp * 2) / 3)} mmHg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9EA4B5]">Circadian Disruption:</span>
              <span className={sleepScore < 0.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {(currentTelemetry.sleep_hours).toFixed(1)}h ({(currentTelemetry.sleep_efficiency * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
