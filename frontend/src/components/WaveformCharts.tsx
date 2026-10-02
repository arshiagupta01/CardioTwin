import React, { useState } from 'react';
import { DayTelemetry, RiskState } from '../types/clinical';
import { Moon, TrendingDown, Footprints, AlertTriangle } from 'lucide-react';

interface WaveformChartsProps {
  telemetrySeries: DayTelemetry[];
  activeDay: number;
  onSelectDay?: (day: number) => void;
  state: RiskState;
}

export const WaveformCharts: React.FC<WaveformChartsProps> = ({
  telemetrySeries,
  activeDay,
  onSelectDay,
  state,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // SVG coordinate calculations for HRV (range: 10 - 70 ms)
  const chartWidth = 560;
  const chartHeight = 120;
  const paddingX = 30;
  const paddingY = 20;

  const getHrvY = (val: number) => {
    const min = 15;
    const max = 65;
    const ratio = (val - min) / (max - min);
    return chartHeight - paddingY - (ratio * (chartHeight - (2 * paddingY)));
  };

  const getRhrY = (val: number) => {
    const min = 55;
    const max = 100;
    const ratio = (val - min) / (max - min);
    return chartHeight - paddingY - (ratio * (chartHeight - (2 * paddingY)));
  };

  const getX = (dayIndex: number) => {
    const step = (chartWidth - (2 * paddingX)) / (telemetrySeries.length - 1);
    return paddingX + ((dayIndex - 1) * step);
  };

  // Build SVG path for HRV
  const hrvPoints = telemetrySeries.map((d) => `${getX(d.day_index)},${getHrvY(d.hrv_mean)}`);
  const hrvPath = `M ${hrvPoints.join(' L ')}`;
  const hrvArea = `${hrvPath} L ${getX(telemetrySeries[telemetrySeries.length - 1].day_index)},${chartHeight - paddingY} L ${getX(1)},${chartHeight - paddingY} Z`;

  // Build SVG path for Resting Heart Rate
  const rhrPoints = telemetrySeries.map((d) => `${getX(d.day_index)},${getRhrY(d.resting_hr_mean)}`);
  const rhrPath = `M ${rhrPoints.join(' L ')}`;

  const activeRecord = telemetrySeries.find((d) => d.day_index === (hoveredDay || activeDay)) || telemetrySeries[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Chart 1: HRV (RMSSD in ms) 10-Day Longitudinal Autonomic Degradation Curve */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#F2F4F6]">
              HRV TRAJECTORY // RMSSD AUTONOMIC DRIFT
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-[#9EA4B5]">
              ACTIVE D-{activeRecord.day_index}: <strong className="text-emerald-400">{activeRecord.hrv_mean.toFixed(1)} ms</strong>
            </span>
            <span className="text-red-400 font-semibold">
              Δ BASELINE: -{activeRecord.hrv_drop_from_baseline.toFixed(1)} ms
            </span>
          </div>
        </div>

        {/* SVG Curve for HRV */}
        <div className="relative w-full overflow-hidden bg-[#0A0E18] rounded-[2px] border border-[#323D57]/60">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 block">
            <defs>
              <linearGradient id="hrvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#EF4444" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Threshold Reference Bands */}
            {/* Safe threshold (>45ms) */}
            <line
              x1={paddingX}
              y1={getHrvY(45)}
              x2={chartWidth - paddingX}
              y2={getHrvY(45)}
              stroke="#34D399"
              strokeDasharray="3 3"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <text x={paddingX + 4} y={getHrvY(45) - 3} fill="#34D399" fontSize="8" fontFamily="monospace" opacity="0.7">
              45ms (HOMEOSTASIS BASELINE)
            </text>

            {/* Strain threshold (25ms) */}
            <line
              x1={paddingX}
              y1={getHrvY(25)}
              x2={chartWidth - paddingX}
              y2={getHrvY(25)}
              stroke="#F87171"
              strokeDasharray="3 3"
              strokeWidth="0.8"
              opacity="0.5"
            />
            <text x={paddingX + 4} y={getHrvY(25) - 3} fill="#F87171" fontSize="8" fontFamily="monospace" opacity="0.8">
              25ms (ACUTE DECOMPENSATION THRESHOLD)
            </text>

            {/* Filled area */}
            <path d={hrvArea} fill="url(#hrvGradient)" />

            {/* Main HRV line */}
            <path
              d={hrvPath}
              fill="none"
              stroke="#34D399"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {telemetrySeries.map((d) => {
              const cx = getX(d.day_index);
              const cy = getHrvY(d.hrv_mean);
              const isSelected = d.day_index === activeDay;
              const isHovered = d.day_index === hoveredDay;
              const pointColor = d.hrv_mean < 25 ? '#F87171' : d.hrv_mean < 38 ? '#FBBF24' : '#34D399';

              return (
                <g
                  key={d.day_index}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d.day_index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => onSelectDay?.(d.day_index)}
                >
                  {/* Active highlight ring */}
                  {(isSelected || isHovered) && (
                    <circle cx={cx} cy={cy} r="8" fill="none" stroke={pointColor} strokeWidth="1.5" className="animate-ping" />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "5" : "3.5"}
                    fill={pointColor}
                    stroke="#0A0E18"
                    strokeWidth="1.5"
                  />
                  {/* Day marker */}
                  <text
                    x={cx}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill={isSelected ? '#FFFFFF' : '#9EA4B5'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    D{d.day_index}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Chart 2: Resting Heart Rate vs Mean HR Dual-Trace Trend */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#F2F4F6]">
              RESTING HR ELEVATION // NOCTURNAL OVERDRIVE
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-[#9EA4B5]">
              RHR: <strong className="text-amber-400">{activeRecord.resting_hr_mean.toFixed(1)} bpm</strong>
            </span>
            <span className="text-amber-400">
              RISE: +{activeRecord.resting_hr_rise_from_baseline.toFixed(1)} bpm
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden bg-[#0A0E18] rounded-[2px] border border-[#323D57]/60">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 block">
            {/* Resting HR line */}
            <path
              d={rhrPath}
              fill="none"
              stroke="#FBBF24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Threshold line at 80 bpm */}
            <line
              x1={paddingX}
              y1={getRhrY(80)}
              x2={chartWidth - paddingX}
              y2={getRhrY(80)}
              stroke="#F87171"
              strokeDasharray="2 2"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <text x={paddingX + 4} y={getRhrY(80) - 3} fill="#F87171" fontSize="8" fontFamily="monospace" opacity="0.7">
              80 BPM (TACHYCARDIA ALERT)
            </text>

            {telemetrySeries.map((d) => {
              const cx = getX(d.day_index);
              const cy = getRhrY(d.resting_hr_mean);
              const isSelected = d.day_index === activeDay;
              const pointColor = d.resting_hr_mean > 82 ? '#F87171' : d.resting_hr_mean > 74 ? '#FBBF24' : '#34D399';

              return (
                <circle
                  key={d.day_index}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? "4.5" : "3"}
                  fill={pointColor}
                  stroke="#0A0E18"
                  strokeWidth="1.2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Chart 3: Sleep Architecture & Physical Exertion Load */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sleep Breakdown */}
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
              <Moon className="w-3 h-3 text-indigo-400" />
              SLEEP DURATION
            </div>
            <span className="text-[10px] font-mono font-bold text-[#F2F4F6]">
              {activeRecord.sleep_hours.toFixed(1)} hrs
            </span>
          </div>

          {/* Stacked hypnogram bar */}
          <div className="w-full h-3 bg-[#0A0E18] rounded-[2px] flex overflow-hidden border border-[#323D57]/40 mb-1.5">
            {/* Deep Sleep */}
            <div
              style={{ width: `${(Math.min(activeRecord.sleep_hours * 0.15, 1.2) / 8) * 100}%` }}
              className="bg-indigo-600 h-full"
              title="Deep Sleep"
            />
            {/* REM Sleep */}
            <div
              style={{ width: `${(Math.min(activeRecord.sleep_hours * 0.25, 1.8) / 8) * 100}%` }}
              className="bg-purple-500 h-full"
              title="REM Sleep"
            />
            {/* Light Sleep */}
            <div
              style={{ width: `${(Math.min(activeRecord.sleep_hours * 0.60, 4.5) / 8) * 100}%` }}
              className="bg-sky-400/80 h-full"
              title="Light Sleep"
            />
          </div>

          <div className="flex justify-between text-[8px] font-mono text-[#9EA4B5]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-[1px]" /> Deep
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-[1px]" /> REM
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-[1px]" /> Light
            </span>
            <span className="text-emerald-400 font-semibold">
              Eff: {Math.round(activeRecord.sleep_efficiency * 100)}%
            </span>
          </div>
        </div>

        {/* Steps / Exertion */}
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
              <Footprints className="w-3 h-3 text-cyan-400" />
              DAILY STEPS & LOAD
            </div>
            <span className="text-[10px] font-mono font-bold text-[#F2F4F6]">
              {activeRecord.daily_steps.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-3 bg-[#0A0E18] rounded-[2px] overflow-hidden border border-[#323D57]/40 mb-1.5">
            <div
              className="h-full transition-all duration-500 rounded-[1px]"
              style={{
                width: `${Math.min(100, (activeRecord.daily_steps / 10000) * 100)}%`,
                backgroundColor: activeRecord.daily_steps < 3000 ? '#F87171' : activeRecord.daily_steps < 6000 ? '#FBBF24' : '#34D399'
              }}
            />
          </div>

          <div className="flex justify-between text-[8px] font-mono text-[#9EA4B5]">
            <span>TARGET: 8,000</span>
            <span className="text-[#F2F4F6]">LOAD SCORE: {activeRecord.activity_score.toFixed(0)}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
