import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Maximize2, Gauge, Zap } from 'lucide-react';
import { RiskState } from '../types/clinical';

interface OscilloscopeMonitorProps {
  bpm: number;
  hrv: number;
  state: RiskState;
  height?: number;
}

export const OscilloscopeMonitor: React.FC<OscilloscopeMonitorProps> = ({
  bpm,
  hrv,
  state,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [speed, setSpeed] = useState<'25' | '50'>('25');
  const [gain, setGain] = useState<'1x' | '2x'>('1x');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Trace colors depending on risk state
  const traceColors = {
    homeostasis: '#34D399', // Medical green trace
    strain: '#FBBF24',      // Amber telemetry trace
    decompensation: '#F87171' // Crimson alert trace
  }[state];

  // Play synthetic clinical monitor beep
  const playCardiacBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Pitch based on state: normal (880Hz A5), warning (740Hz), decompensation (620Hz)
      const freq = state === 'homeostasis' ? 880 : state === 'strain' ? 740 : 580;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sweepX = 0;
    let lastBeatTime = performance.now();
    const pixelRatio = window.devicePixelRatio || 1;

    // Buffer to store recent history for phosphor trail
    const width = canvas.width;
    const canvasHeight = canvas.height;
    const centerY = canvasHeight / 2;

    const render = (time: number) => {
      const beatInterval = (60 / Math.max(45, bpm)) * 1000;
      const timeSinceLastBeat = (time - lastBeatTime) % beatInterval;
      const phase = timeSinceLastBeat / beatInterval; // 0.0 to 1.0

      // Synthesize realistic P-Q-R-S-T complex
      let voltage = 0;
      const gainMultiplier = gain === '2x' ? 1.6 : 1.0;

      if (phase >= 0.08 && phase < 0.18) {
        // P-wave (atrial depolarization)
        const pPhase = (phase - 0.08) / 0.10;
        voltage = Math.sin(pPhase * Math.PI) * 0.15;
      } else if (phase >= 0.22 && phase < 0.24) {
        // Q-dip (septal depolarization)
        voltage = -0.15;
      } else if (phase >= 0.24 && phase < 0.28) {
        // R-peak (ventricular depolarization)
        const rPhase = (phase - 0.24) / 0.04;
        voltage = Math.sin(rPhase * Math.PI) * 1.35;
        // Trigger beep right at apex of R-wave
        if (phase > 0.25 && phase < 0.26) {
          playCardiacBeep();
        }
      } else if (phase >= 0.28 && phase < 0.31) {
        // S-dip (ventricular depolarization end)
        voltage = -0.35;
      } else if (phase >= 0.38 && phase < 0.54) {
        // T-wave (ventricular repolarization)
        const tPhase = (phase - 0.38) / 0.16;
        voltage = Math.sin(tPhase * Math.PI) * 0.28;
      } else {
        // Baseline noise / isoelectric line with slight respiratory wander
        voltage = (Math.sin(time * 0.002) * 0.02) + ((Math.random() - 0.5) * 0.015);
      }

      const y = centerY - (voltage * 38 * gainMultiplier);

      // Sweep advance speed: 25 mm/s = ~2.5px/frame, 50 mm/s = ~5px/frame
      const sweepAdvance = speed === '50' ? 4.5 : 2.5;

      // Clear a 12px vertical band ahead of the sweep line (erase beam)
      ctx.fillStyle = '#050B14';
      ctx.fillRect(sweepX, 0, 16, canvasHeight);

      // Redraw faint medical grid within erased segment
      ctx.strokeStyle = state === 'decompensation'
        ? 'rgba(248, 113, 113, 0.08)'
        : state === 'strain'
          ? 'rgba(251, 191, 36, 0.08)'
          : 'rgba(52, 211, 153, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Draw 20px grid lines
      for (let gx = Math.floor(sweepX / 20) * 20; gx < sweepX + 16; gx += 20) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvasHeight);
      }
      ctx.moveTo(sweepX, centerY);
      ctx.lineTo(sweepX + 16, centerY);
      ctx.stroke();

      // Draw the active trace dot and phosphorescent glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = traceColors;
      ctx.strokeStyle = traceColors;
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(sweepX, y);
      ctx.lineTo(sweepX + sweepAdvance, y);
      ctx.stroke();

      // Draw bright leading sweep head
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sweepX + sweepAdvance, y - 1, 2, 2);

      // Advance sweep head
      sweepX += sweepAdvance;
      if (sweepX >= width) {
        sweepX = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bpm, hrv, state, speed, gain, soundEnabled]);

  return (
    <div className="relative rounded-[4px] border border-[#323D57] bg-[#050B14] overflow-hidden flex flex-col">
      {/* Oscilloscope Header Console Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0A0E18] border-b border-[#323D57] text-[10px]">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            LEAD II // ECG 60 FPS
          </span>
          <span className="text-[#9EA4B5] font-mono">CAL: 1mV = 10mm</span>
          <span className="text-[#9EA4B5] font-mono">FILT: 0.05-40Hz</span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {/* Audio Bleep Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-1.5 py-0.5 rounded-[2px] border text-[9px] flex items-center gap-1 transition-colors ${
              soundEnabled
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                : 'border-[#323D57] bg-[#131B2E] text-[#9EA4B5] hover:text-[#F2F4F6]'
            }`}
            title="Toggle cardiac monitor sound"
          >
            {soundEnabled ? <Volume2 className="w-2.5 h-2.5 text-emerald-400" /> : <VolumeX className="w-2.5 h-2.5" />}
            {soundEnabled ? 'BEEP ON' : 'MUTE'}
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setSpeed(speed === '25' ? '50' : '25')}
            className="px-1.5 py-0.5 rounded-[2px] border border-[#323D57] bg-[#131B2E] text-[9px] text-[#9EA4B5] hover:text-[#F2F4F6]"
          >
            {speed} mm/s
          </button>

          {/* Gain Toggle */}
          <button
            onClick={() => setGain(gain === '1x' ? '2x' : '1x')}
            className="px-1.5 py-0.5 rounded-[2px] border border-[#323D57] bg-[#131B2E] text-[9px] text-[#9EA4B5] hover:text-[#F2F4F6]"
          >
            {gain}
          </button>
        </div>
      </div>

      {/* Main Canvas Display Area */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          className="w-full h-full block ecg-grid"
        />

        {/* Live Vitals HUD Overlay */}
        <div className="absolute top-2 right-3 pointer-events-none flex items-center gap-3 font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#9EA4B5] uppercase">HR READOUT</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold" style={{ color: traceColors }}>
                {bpm}
              </span>
              <span className="text-[9px] text-[#9EA4B5]">BPM</span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#323D57]" />

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-[#9EA4B5] uppercase">HRV / RMSSD</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-[#F2F4F6]">
                {hrv.toFixed(1)}
              </span>
              <span className="text-[9px] text-[#9EA4B5]">ms</span>
            </div>
          </div>
        </div>

        {/* Sweep indicator badge */}
        <div className="absolute bottom-1.5 left-3 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono text-[#9EA4B5]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>SYNCHRONIZED TELEMETRY SWEEP</span>
        </div>
      </div>
    </div>
  );
};
