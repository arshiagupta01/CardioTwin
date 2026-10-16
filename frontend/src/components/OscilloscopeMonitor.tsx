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

  // Keep dynamic props in refs so the animation loop NEVER restarts or resets sweepX
  const propsRef = useRef({ bpm, hrv, state, speed, gain, soundEnabled, traceColors });
  useEffect(() => {
    propsRef.current = { bpm, hrv, state, speed, gain, soundEnabled, traceColors };
  }, [bpm, hrv, state, speed, gain, soundEnabled, traceColors]);

  const sweepXRef = useRef(0);
  const prevYRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(performance.now());
  const hasBeepedRef = useRef(false);

  // Play synthetic clinical monitor beep
  const playCardiacBeep = () => {
    if (!propsRef.current.soundEnabled) return;
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

      const currentState = propsRef.current.state;
      const freq = currentState === 'homeostasis' ? 880 : currentState === 'strain' ? 740 : 580;
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

    // Resize canvas to match display size for crisp rendering
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        // Fill initial background with deep black medical screen
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#050B14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = (now: number) => {
      const { bpm: currentBpm, gain: currentGain, speed: currentSpeed, state: currentState, traceColors: currentTraceColor } = propsRef.current;

      const width = canvas.width;
      const canvasHeight = canvas.height;
      const centerY = canvasHeight / 2;

      // Calculate time delta for smooth frame-rate independent sweep
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      // Heartbeat interval and phase calculation
      const safeBpm = Math.max(40, Math.min(200, currentBpm));
      const beatInterval = (60 / safeBpm) * 1000;
      const timeSinceLastBeat = now - lastBeatTimeRef.current;

      if (timeSinceLastBeat >= beatInterval) {
        lastBeatTimeRef.current = now;
        hasBeepedRef.current = false;
      }

      const phase = Math.min(1.0, Math.max(0.0, (now - lastBeatTimeRef.current) / beatInterval));

      // Synthesize realistic P-Q-R-S-T cardiac complex
      let voltage = 0;
      const gainMultiplier = currentGain === '2x' ? 1.6 : 1.0;

      if (phase >= 0.08 && phase < 0.18) {
        // P-wave (atrial depolarization)
        const pPhase = (phase - 0.08) / 0.10;
        voltage = Math.sin(pPhase * Math.PI) * 0.16;
      } else if (phase >= 0.22 && phase < 0.24) {
        // Q-dip (septal depolarization)
        voltage = -0.18;
      } else if (phase >= 0.24 && phase < 0.28) {
        // R-peak (ventricular depolarization)
        const rPhase = (phase - 0.24) / 0.04;
        voltage = Math.sin(rPhase * Math.PI) * 1.35;
        // Trigger cardiac audio beep once at peak
        if (!hasBeepedRef.current && phase >= 0.25) {
          hasBeepedRef.current = true;
          playCardiacBeep();
        }
      } else if (phase >= 0.28 && phase < 0.31) {
        // S-dip (ventricular depolarization completion)
        voltage = -0.38;
      } else if (phase >= 0.38 && phase < 0.54) {
        // T-wave (ventricular repolarization)
        const tPhase = (phase - 0.38) / 0.16;
        voltage = Math.sin(tPhase * Math.PI) * 0.28;
      } else {
        // Isoelectric baseline with mild physiological noise
        voltage = Math.sin(now * 0.002) * 0.02 + ((Math.random() - 0.5) * 0.012);
      }

      const y = centerY - voltage * (canvasHeight * 0.32) * gainMultiplier;

      // Sweep advance speed: 25 mm/s = ~120px/s, 50 mm/s = ~240px/s (scaled to canvas resolution)
      const pxPerSec = (currentSpeed === '50' ? 240 : 130) * (canvas.width / 640);
      const sweepAdvance = Math.max(1.5, pxPerSec * dt);

      const sweepX = sweepXRef.current;
      const nextX = sweepX + sweepAdvance;

      // 1. Clear vertical erase beam ahead of the sweep line (NO SHADOW on erase beam)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      const eraseBandWidth = Math.max(16, sweepAdvance * 4);
      ctx.fillStyle = '#050B14';
      ctx.fillRect(sweepX, 0, eraseBandWidth, canvasHeight);

      // 2. Redraw faint medical ECG grid within erased band (NO SHADOW on grid)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = currentState === 'decompensation'
        ? 'rgba(248, 113, 113, 0.08)'
        : currentState === 'strain'
          ? 'rgba(251, 191, 36, 0.08)'
          : 'rgba(52, 211, 153, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gridSpacing = 20 * (window.devicePixelRatio || 1);
      const startGridX = Math.floor(sweepX / gridSpacing) * gridSpacing;
      for (let gx = startGridX; gx < sweepX + eraseBandWidth; gx += gridSpacing) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvasHeight);
      }
      ctx.moveTo(sweepX, centerY);
      ctx.lineTo(sweepX + eraseBandWidth, centerY);
      ctx.stroke();

      // 3. Draw continuous smooth ECG trace line connecting previous frame to current frame
      const prevY = prevYRef.current !== null ? prevYRef.current : y;
      ctx.shadowBlur = 6;
      ctx.shadowColor = currentTraceColor;
      ctx.strokeStyle = currentTraceColor;
      ctx.lineWidth = 2.2 * (window.devicePixelRatio || 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(sweepX, prevY);
      ctx.lineTo(nextX, y);
      ctx.stroke();

      // 4. Draw bright leading phosphor sweep head dot
      ctx.shadowBlur = 6;
      ctx.shadowColor = currentTraceColor;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(nextX, y, 2.0 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
      ctx.fill();

      // Always clear shadows immediately so background fillRect never inherits blur
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Advance sweep head
      prevYRef.current = y;
      if (nextX >= width) {
        sweepXRef.current = 0;
        prevYRef.current = null;
      } else {
        sweepXRef.current = nextX;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []); // Run once on mount! Loop persists continuously across all live vitals updates

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
        <div className="absolute top-2 right-3 pointer-events-none flex items-center gap-3 font-mono ecg-screen-hud">
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
        <div className="absolute bottom-1.5 left-3 pointer-events-none flex items-center gap-1.5 text-[9px] font-mono text-[#9EA4B5] ecg-screen-hud">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>SYNCHRONIZED TELEMETRY SWEEP</span>
        </div>
      </div>
    </div>
  );
};
