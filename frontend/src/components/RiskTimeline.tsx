import React, { useEffect, useRef, useState } from 'react';
import { DayTelemetry } from '../types/clinical';
import { TrendingUp, Wifi, WifiOff } from 'lucide-react';

interface RiskTimelineProps {
  /** Per-day telemetry already in cohortData (always available) */
  telemetrySeries: DayTelemetry[];
  /** Currently active day in the scrubber */
  activeDay: number;
  /** Patient ID used to fetch live API data */
  patientId: number;
  onDayChange: (day: number) => void;
}

interface ApiDay {
  day_index: number;
  risk_score: number;
  risk_percent: number;
  state: string;
}

const STATE_COLOR: Record<string, string> = {
  homeostasis:   '#34D399', // emerald
  strain:        '#FBBF24', // amber
  decompensation:'#F87171', // red
};

const BAND_STRAIN = 25;        // % threshold
const BAND_DECOMP = 65;        // % threshold
const CHART_H = 96;            // px canvas height
const PAD_L = 36;              // left padding for y-axis labels
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 20;

export const RiskTimeline: React.FC<RiskTimelineProps> = ({
  telemetrySeries,
  activeDay,
  patientId,
  onDayChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live data from API (null while loading / unavailable)
  const [apiData, setApiData] = useState<ApiDay[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Fallback: derive risk percent from local telemetry
  const localPoints: ApiDay[] = telemetrySeries.map((d) => ({
    day_index: d.day_index,
    risk_score: d.risk_score,
    risk_percent: parseFloat((d.risk_score * 100).toFixed(1)),
    state: d.state,
  }));

  // Points to render: prefer live API data
  const points: ApiDay[] = apiData ?? localPoints;

  // Fetch from API
  useEffect(() => {
    setApiLoading(true);
    setApiError(false);
    fetch(`/api/patients/${patientId}/risk_timeline`)
      .then((r) => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then((data: { timeline: ApiDay[] }) => {
        setApiData(data.timeline);
        setApiLoading(false);
      })
      .catch(() => {
        setApiError(true);
        setApiLoading(false);
      });
  }, [patientId]);

  // ─── Canvas rendering ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || points.length === 0) return;

    const W = container.clientWidth;
    canvas.width  = W;
    canvas.height = CHART_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawW = W - PAD_L - PAD_R;
    const drawH = CHART_H - PAD_T - PAD_B;
    const n = points.length;

    // Map coordinates
    const xOf = (i: number) => PAD_L + (i / (n - 1)) * drawW;
    const yOf = (pct: number) => PAD_T + drawH - (pct / 100) * drawH;

    ctx.clearRect(0, 0, W, CHART_H);

    // ── Background risk bands ─────────────────────────────────────────────────
    // Green zone (0–25%)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
    ctx.fillRect(PAD_L, yOf(BAND_STRAIN), drawW, yOf(0) - yOf(BAND_STRAIN));
    // Amber zone (25–65%)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
    ctx.fillRect(PAD_L, yOf(BAND_DECOMP), drawW, yOf(BAND_STRAIN) - yOf(BAND_DECOMP));
    // Red zone (65–100%)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(PAD_L, PAD_T, drawW, yOf(BAND_DECOMP) - PAD_T);

    // ── Threshold dashed lines ────────────────────────────────────────────────
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 0.8;

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.beginPath();
    ctx.moveTo(PAD_L, yOf(BAND_STRAIN));
    ctx.lineTo(W - PAD_R, yOf(BAND_STRAIN));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
    ctx.beginPath();
    ctx.moveTo(PAD_L, yOf(BAND_DECOMP));
    ctx.lineTo(W - PAD_R, yOf(BAND_DECOMP));
    ctx.stroke();

    ctx.setLineDash([]);

    // ── Y-axis labels ─────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(158, 164, 181, 0.8)';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('100%', PAD_L - 4, yOf(100) + 4);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.fillText(`${BAND_DECOMP}%`,  PAD_L - 4, yOf(BAND_DECOMP) + 3);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
    ctx.fillText(`${BAND_STRAIN}%`,  PAD_L - 4, yOf(BAND_STRAIN) + 3);
    ctx.fillStyle = 'rgba(158, 164, 181, 0.8)';
    ctx.fillText('0%',   PAD_L - 4, yOf(0) + 3);

    // ── Risk curve with gradient fill ─────────────────────────────────────────
    // Gradient under the line
    const grad = ctx.createLinearGradient(0, PAD_T, 0, CHART_H - PAD_B);
    grad.addColorStop(0,   'rgba(248, 113, 113, 0.35)');
    grad.addColorStop(0.45,'rgba(251, 191, 36, 0.20)');
    grad.addColorStop(1,   'rgba(52, 211, 153, 0.05)');

    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(points[0].risk_percent));
    for (let i = 1; i < n; i++) {
      const x0 = xOf(i - 1), y0 = yOf(points[i - 1].risk_percent);
      const x1 = xOf(i), y1 = yOf(points[i].risk_percent);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    // Close area down to x-axis
    ctx.lineTo(xOf(n - 1), yOf(0));
    ctx.lineTo(xOf(0), yOf(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw line itself (colour-coded per segment state)
    for (let i = 1; i < n; i++) {
      const color = STATE_COLOR[points[i].state] ?? '#9EA4B5';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const x0 = xOf(i - 1), y0 = yOf(points[i - 1].risk_percent);
      const x1 = xOf(i), y1 = yOf(points[i].risk_percent);
      const cpx = (x0 + x1) / 2;
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
      ctx.stroke();
    }

    // ── Data point dots ───────────────────────────────────────────────────────
    points.forEach((pt, i) => {
      const x = xOf(i);
      const y = yOf(pt.risk_percent);
      const isActive = pt.day_index === activeDay;
      const color = STATE_COLOR[pt.state] ?? '#9EA4B5';

      ctx.beginPath();
      ctx.arc(x, y, isActive ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#FFFFFF' : color;
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Active day value tooltip bubble
      if (isActive) {
        const label = `${pt.risk_percent}%`;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        const tw = ctx.measureText(label).width;
        const bx = Math.min(Math.max(x - tw / 2 - 4, PAD_L), W - PAD_R - tw - 8);
        const by = y - 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + 8, 14, 2);
        ctx.fill();
        ctx.fillStyle = '#0A0E18';
        ctx.textAlign = 'left';
        ctx.fillText(label, bx + 4, by + 10);
      }

      // Day label on x-axis
      ctx.fillStyle = 'rgba(158, 164, 181, 0.7)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`D${pt.day_index}`, x, CHART_H - 5);
    });

  }, [points, activeDay]);

  // ─── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => {
      // Trigger re-render
      setApiData((prev) => prev ? [...prev] : null);
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Current point info
  const activePt = points.find((p) => p.day_index === activeDay) ?? points[points.length - 1];
  const stateColor = activePt ? STATE_COLOR[activePt.state] : '#9EA4B5';

  return (
    <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-mono text-[#9EA4B5]">
            RISK SCORE TIMELINE // 10-DAY LONGITUDINAL CASCADE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Live/offline badge */}
          {apiLoading ? (
            <span className="text-[9px] font-mono text-[#9EA4B5] animate-pulse">FETCHING…</span>
          ) : apiData && !apiError ? (
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <Wifi className="w-2.5 h-2.5" /> XGB LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400">
              <WifiOff className="w-2.5 h-2.5" /> LOCAL
            </span>
          )}
          {/* Active day score */}
          {activePt && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px]"
              style={{ color: stateColor, borderColor: stateColor + '60', border: '1px solid' }}
            >
              D{activePt.day_index}: {activePt.risk_percent}%
            </span>
          )}
        </div>
      </div>

      {/* Canvas chart */}
      <div ref={containerRef} className="w-full relative cursor-crosshair" style={{ height: CHART_H }}>
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: CHART_H }}
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
            const relX = e.clientX - rect.left - PAD_L;
            const drawW = rect.width - PAD_L - PAD_R;
            const n = points.length;
            if (n < 2 || relX < 0 || relX > drawW) return;
            const ratio = relX / drawW;
            const idx = Math.round(ratio * (n - 1));
            const pt = points[Math.max(0, Math.min(n - 1, idx))];
            if (pt) onDayChange(pt.day_index);
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1.5 font-mono text-[9px] text-[#9EA4B5]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          HOMEOSTASIS (&lt;{BAND_STRAIN}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          STRAIN ({BAND_STRAIN}–{BAND_DECOMP}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          DECOMPENSATION (&gt;{BAND_DECOMP}%)
        </span>
        <span className="ml-auto">CLICK CHART TO SCRUB DAY</span>
      </div>
    </div>
  );
};
