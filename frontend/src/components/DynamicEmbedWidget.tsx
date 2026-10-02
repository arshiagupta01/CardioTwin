import React, { useState } from 'react';
import { Box, Sparkles, ExternalLink, Code2, RefreshCw, Check, Globe } from 'lucide-react';
import { RiskState } from '../types/clinical';

interface DynamicEmbedWidgetProps {
  bpm: number;
  hrv: number;
  state: RiskState;
}

interface EmbedPreset {
  id: string;
  name: string;
  source: string;
  type: 'sketchfab' | 'lottie' | 'iframe';
  embedUrl: string;
  description: string;
}

export const EMBED_PRESETS: EmbedPreset[] = [
  {
    id: 'sketchfab-heart-3d',
    name: '3D Interactive Anatomical Heart (Rotatable)',
    source: 'Sketchfab 3D',
    type: 'sketchfab',
    // High-quality public 3D anatomical heart with rotatable orbit and zoom
    embedUrl: 'https://sketchfab.com/models/0d68f230554c4fffaeb6c4293f0b2f6b/embed?autostart=1&preload=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_watermark=0',
    description: 'Real-time 3D rendered human cardiac model with interactive click-and-drag rotation, zoom, and lighting.'
  },
  {
    id: 'lottie-heart-beat',
    name: 'Dynamic Vector Cardiac Pulse Animation',
    source: 'LottieFiles',
    type: 'lottie',
    embedUrl: 'https://lottie.host/embed/84cfa976-583d-4c31-8f53-27eb84511ef5/3n7M6iE8vF.json',
    description: 'High-framerate Lottie vector heartbeat animation with glowing systolic waves.'
  },
  {
    id: 'sketchfab-cardio-system',
    name: '3D Cardiovascular Circulatory Loop',
    source: 'Sketchfab 3D',
    type: 'sketchfab',
    embedUrl: 'https://sketchfab.com/models/69dcffc09fe04661a357eb465a3d7637/embed?autostart=1&preload=1&ui_controls=0&ui_infos=0',
    description: '3D arterial vascular network illustrating blood pressure resistance and systemic afterload.'
  }
];

export const DynamicEmbedWidget: React.FC<DynamicEmbedWidgetProps> = ({
  bpm,
  hrv,
  state,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sketchfab-heart-3d');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeUrl, setActiveUrl] = useState<string>(EMBED_PRESETS[0].embedUrl);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const selectedPreset = EMBED_PRESETS.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (preset: EmbedPreset) => {
    setSelectedPresetId(preset.id);
    setActiveUrl(preset.embedUrl);
    setIsEditingCustom(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // If user pasted an entire iframe tag: extract the src="..."
    let cleanUrl = customUrl.trim();
    const srcMatch = cleanUrl.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1];
    }

    setActiveUrl(cleanUrl);
    setSelectedPresetId('custom');
    setIsEditingCustom(false);
  };

  return (
    <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] overflow-hidden flex flex-col">
      {/* Widget Header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0A0E18] border-b border-[#323D57] gap-2">
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#F2F4F6] uppercase">
            3D EMBEDDED DIGITAL TWIN // EXTERNAL VISUAL ENGINE
          </span>
        </div>

        {/* Source Presets Switcher */}
        <div className="flex items-center gap-1 font-mono text-[9px]">
          {EMBED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-2 py-0.5 rounded-[2px] border transition-colors ${
                selectedPresetId === preset.id
                  ? 'bg-sky-950/70 border-sky-500 text-sky-300 font-bold'
                  : 'border-[#323D57] text-[#9EA4B5] hover:text-[#F2F4F6]'
              }`}
            >
              {preset.source}
            </button>
          ))}

          <button
            onClick={() => setIsEditingCustom(!isEditingCustom)}
            className={`px-2 py-0.5 rounded-[2px] border flex items-center gap-1 ${
              selectedPresetId === 'custom' || isEditingCustom
                ? 'bg-purple-950/70 border-purple-500 text-purple-300 font-bold'
                : 'border-[#323D57] text-[#9EA4B5] hover:text-[#F2F4F6]'
            }`}
          >
            <Code2 className="w-2.5 h-2.5" />
            <span>+ PASTE LINK</span>
          </button>
        </div>
      </div>

      {/* Custom URL Input Bar (if open) */}
      {isEditingCustom && (
        <form onSubmit={handleApplyCustom} className="p-2.5 bg-[#161E31] border-b border-[#323D57] flex items-center gap-2 font-mono text-xs">
          <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Paste embed URL or iframe code (from Sketchfab, LottieFiles, Spline, BioDigital, CodePen)..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-[#0A0E18] border border-[#323D57] px-2.5 py-1 rounded-[2px] text-xs text-[#F2F4F6] placeholder-[#9EA4B5]/60 focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-[2px] text-[10px] font-bold flex items-center gap-1 shrink-0"
          >
            <Check className="w-3 h-3" />
            LOAD EMBED
          </button>
        </form>
      )}

      {/* Main 3D / Dynamic Embed Viewport */}
      <div className="relative w-full h-72 bg-[#050B14] overflow-hidden flex items-center justify-center">
        {activeUrl ? (
          <iframe
            key={activeUrl}
            src={activeUrl}
            title="CardioTwin Dynamic Embed"
            className="w-full h-full border-0 block"
            allow="autoplay; fullscreen; xr-spatial-tracking; execution-while-out-of-viewport; execution-while-not-rendered; web-share"
            loading="lazy"
          />
        ) : (
          <div className="text-center p-6 text-[#9EA4B5] font-mono text-xs">
            No embed URL loaded. Select a preset above or paste an embed link.
          </div>
        )}

        {/* Live Synchronized Vitals HUD (Floating Overlay) */}
        <div className="absolute top-2 left-2 z-10 bg-[#0A0E18]/85 border border-[#323D57] px-2.5 py-1 rounded-[2px] backdrop-blur-sm font-mono pointer-events-none">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[8px] uppercase text-[#9EA4B5]">LIVE RHYTHM</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {bpm} BPM
              </div>
            </div>

            <div className="h-4 w-px bg-[#323D57]" />

            <div>
              <div className="text-[8px] uppercase text-[#9EA4B5]">AUTONOMIC HRV</div>
              <div className="text-xs font-semibold text-[#F2F4F6]">
                {hrv.toFixed(1)} ms
              </div>
            </div>

            <div className="h-4 w-px bg-[#323D57]" />

            <div>
              <div className="text-[8px] uppercase text-[#9EA4B5]">TWIN STATUS</div>
              <div className={`text-[10px] font-bold uppercase ${
                state === 'decompensation' ? 'text-red-400' : state === 'strain' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {state}
              </div>
            </div>
          </div>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-2 right-2 z-10 bg-[#0A0E18]/85 border border-[#323D57] px-2 py-0.5 rounded-[2px] text-[8px] font-mono text-[#9EA4B5] pointer-events-none">
          CLICK & DRAG TO ROTATE 3D MODEL • SCROLL TO ZOOM
        </div>
      </div>

      {/* Description Footer */}
      <div className="px-3 py-1.5 bg-[#0A0E18] border-t border-[#323D57] flex items-center justify-between text-[9px] font-mono text-[#9EA4B5]">
        <div className="truncate pr-2">
          {selectedPreset ? selectedPreset.description : 'Custom dynamic embed stream loaded.'}
        </div>
        <span className="shrink-0 text-sky-400 font-semibold">
          {selectedPresetId === 'custom' ? 'CUSTOM EMBED' : selectedPreset?.source}
        </span>
      </div>
    </div>
  );
};
