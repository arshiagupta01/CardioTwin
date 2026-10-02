import React, { useEffect, useRef } from 'react';
import { Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import lottie, { AnimationItem } from 'lottie-web';
import { RiskState } from '../types/clinical';

interface DynamicBeatingHeartProps {
  bpm: number;
  hrv: number;
  state: RiskState;
  showDetails?: boolean;
}

export const DynamicBeatingHeart: React.FC<DynamicBeatingHeartProps> = ({
  bpm,
  hrv,
  state,
  showDetails = true,
}) => {
  const animationContainer = useRef<HTMLDivElement>(null);
  const animation = useRef<AnimationItem | null>(null);
  const beatDuration = (60 / Math.max(40, Math.min(180, bpm))).toFixed(3);

  // Play the supplied Lottie heart and sync its loop speed to the displayed BPM.
  useEffect(() => {
    if (!animationContainer.current) return;

    const item = lottie.loadAnimation({
      container: animationContainer.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/cardiac-heart.json',
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    animation.current = item;

    return () => {
      item.destroy();
      animation.current = null;
    };
  }, []);

  useEffect(() => {
    // The supplied 20-frame animation at 30 fps has a 0.67 second base cycle (~90 BPM).
    animation.current?.setSpeed(Math.max(0.5, Math.min(2, bpm / 90)));
  }, [bpm]);

  // Cardiac output estimations
  const strokeVolume = Math.round(72 - (bpm > 85 ? (bpm - 85) * 0.4 : 0));
  const cardiacOutput = ((bpm * strokeVolume) / 1000).toFixed(1);
  const qtcInterval = Math.round(390 + (bpm > 80 ? (bpm - 80) * 1.2 : 0) + (hrv < 25 ? 18 : 0));

  // State-specific theme colors
  const stateConfig = {
    homeostasis: {
      color: '#34D399', // Emerald
      glow: 'rgba(52, 211, 153, 0.45)',
      ring: 'border-emerald-500/30',
      badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
      label: 'NORMAL SINUS RHYTHM',
      rhythm: 'AUTONOMIC HOMEOSTASIS',
      icon: ShieldCheck,
    },
    strain: {
      color: '#FBBF24', // Amber
      glow: 'rgba(251, 191, 36, 0.55)',
      ring: 'border-amber-500/40',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
      label: 'SYMPATHETIC OVERDRIVE',
      rhythm: 'AUTONOMIC STRAIN',
      icon: AlertCircle,
    },
    decompensation: {
      color: '#F87171', // Red
      glow: 'rgba(248, 113, 113, 0.75)',
      ring: 'border-red-500/50',
      badge: 'bg-red-950/60 text-red-300 border-red-500/50',
      label: 'SINUS TACHYCARDIA / STRAIN',
      rhythm: 'DECOMPENSATION IMMINENT',
      icon: AlertCircle,
    },
  }[state];

  const Icon = stateConfig.icon;

  return (
    <div
      className="relative flex flex-col items-center justify-between p-3 rounded-[4px] border border-[#323D57] bg-[#131B2E] overflow-hidden"
      style={{ '--heart-beat-duration': `${beatDuration}s` } as React.CSSProperties}
    >
      {/* Background ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${stateConfig.glow} 0%, transparent 70%)`
        }}
      />

      {/* Header bar */}
      <div className="w-full flex items-center justify-between z-10 mb-2 border-b border-[#323D57]/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] tracking-widest font-semibold uppercase text-[#9EA4B5]">
            CARDIAC DYNAMICS // BIOPHYSICAL TWIN
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded-[12px] text-[9px] font-mono tracking-wider font-semibold border flex items-center gap-1 ${stateConfig.badge}`}>
          <Icon className="w-2.5 h-2.5" />
          {stateConfig.label}
        </div>
      </div>

      {/* Heart Visualization Area with Radiating Pulse Rings */}
      <div className="relative flex items-center justify-center my-3 w-40 h-40">
        {/* Outer Radiating Pulse Rings */}
        <div
          className="absolute w-32 h-32 rounded-full border border-dashed animate-pulse-ring pointer-events-none"
          style={{ borderColor: stateConfig.color }}
        />
        <div
          className="absolute w-24 h-24 rounded-full border opacity-50 animate-pulse-ring pointer-events-none"
          style={{
            borderColor: stateConfig.color,
            animationDelay: `${Number(beatDuration) * 0.3}s`
          }}
        />

        {/* Lottie anatomical heart animation */}
        <div
          ref={animationContainer}
          role="img"
          aria-label="Animated anatomical heart"
          className="relative z-10 h-32 w-32 transition-transform hover:scale-105"
          style={{ filter: `drop-shadow(0 0 16px ${stateConfig.glow})` }}
        />

        {/* Center Live BPM Overlay Badge */}
        <div className="absolute bottom-1 z-20 flex flex-col items-center bg-[#0A0E18]/90 border border-[#323D57] px-2 py-0.5 rounded-[4px]">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tracking-tight" style={{ color: stateConfig.color }}>
              {bpm}
            </span>
            <span className="text-[10px] text-[#9EA4B5] font-mono">BPM</span>
          </div>
        </div>
      </div>

      {/* Hemodynamic Telemetry Footer Grid */}
      {showDetails && (
        <div className="w-full grid grid-cols-4 gap-1.5 pt-2 border-t border-[#323D57]/70 text-center">
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">HRV (RMSSD)</div>
            <div className="text-xs font-mono font-bold text-[#F2F4F6] mt-0.5">
              {hrv.toFixed(1)} <span className="text-[9px] font-normal text-[#9EA4B5]">ms</span>
            </div>
          </div>

          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">STROKE VOL</div>
            <div className="text-xs font-mono font-bold text-[#F2F4F6] mt-0.5">
              {strokeVolume} <span className="text-[9px] font-normal text-[#9EA4B5]">mL</span>
            </div>
          </div>

          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">CARD. OUTPUT</div>
            <div className="text-xs font-mono font-bold text-[#F2F4F6] mt-0.5">
              {cardiacOutput} <span className="text-[9px] font-normal text-[#9EA4B5]">L/m</span>
            </div>
          </div>

          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">QTc INTERVAL</div>
            <div className="text-xs font-mono font-bold text-[#F2F4F6] mt-0.5">
              {qtcInterval} <span className="text-[9px] font-normal text-[#9EA4B5]">ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
