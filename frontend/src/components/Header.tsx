import React, { useState, useEffect } from 'react';
import { Activity, Radio, Clock, User, PlusCircle, Users, LayoutDashboard, Sun, Moon, Zap, Award } from 'lucide-react';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface HeaderProps {
  currentView: 'cohort' | 'detail';
  onViewChange: (view: 'cohort' | 'detail') => void;
  onOpenDataIntake: () => void;
  onOpenJudgeTour?: () => void;
  selectedPatientId?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenDataIntake,
  onOpenJudgeTour,
  selectedPatientId,
  isDarkMode,
  onToggleTheme,
}) => {
  const [utcTime, setUtcTime] = useState('');
  const { isLiveMode, setIsLiveMode, totalPacketsReceived, samplingRateHz } = useLiveTelemetry();

  // Clinical UTC clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0A0E18]/95 backdrop-blur-md border-b border-[#323D57] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Hardware Stream Beacon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-950/80 border border-emerald-500/50 rounded-[2px] flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider font-mono text-[#F2F4F6] leading-none">
              CARDIOTWIN <span className="text-[#9EA4B5] font-normal">// BIO-DIGITAL TWIN [SYNCAI]</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] border text-[9px] font-mono tracking-wider font-semibold transition-all ${
                  isLiveMode
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                    : 'bg-[#161E31] border-[#323D57] text-[#9EA4B5] hover:text-[#F2F4F6]'
                }`}
                title="Click to toggle live telemetry ingestion"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                <span>
                  {isLiveMode
                    ? `LIVE ${samplingRateHz}HZ STREAM (${totalPacketsReceived.toLocaleString()} PKTS)`
                    : 'STREAM PAUSED (CLICK TO RESUME)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex items-center gap-1 bg-[#131B2E] p-0.5 rounded-[2px] border border-[#323D57] font-mono text-xs">
        <button
          onClick={() => onViewChange('cohort')}
          className={`px-3 py-1 rounded-[2px] flex items-center gap-1.5 transition-colors ${
            currentView === 'cohort'
              ? 'bg-[#161E31] text-[#F2F4F6] font-bold border border-[#7C839B]'
              : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>COHORT ROSTER</span>
        </button>

        <button
          onClick={() => onViewChange('detail')}
          className={`px-3 py-1 rounded-[2px] flex items-center gap-1.5 transition-colors ${
            currentView === 'detail'
              ? 'bg-[#161E31] text-[#F2F4F6] font-bold border border-[#7C839B]'
              : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
          <span>PATIENT TWIN CONSOLE {selectedPatientId ? `(PT-${selectedPatientId})` : ''}</span>
        </button>
      </div>

      {/* Clinical Station Metadata: UTC Clock, Clinician Badge, Theme Toggle */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* Judge 60s Tour Trigger */}
        {onOpenJudgeTour && (
          <button
            onClick={onOpenJudgeTour}
            className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-[2px] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm animate-pulse cursor-pointer border border-amber-400/50"
            title="Launch 60-Second Guided Tour for Hackathon Judges"
          >
            <Award className="w-3.5 h-3.5 text-white" />
            <span>▶ 60s JUDGE TOUR</span>
          </button>
        )}

        {/* Add Record Trigger */}
        <button
          onClick={onOpenDataIntake}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] text-[11px] font-bold flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ ADD RECORD</span>
        </button>

        {/* Real-time UTC Clinical Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#9EA4B5] bg-[#131B2E] px-2 py-1 rounded-[2px] border border-[#323D57]">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>{utcTime || 'UTC CLOCK SYNCING...'}</span>
        </div>

        {/* Clinician Badge */}
        <div className="flex items-center gap-1.5 text-[10px] bg-[#131B2E] px-2 py-1 rounded-[2px] border border-[#323D57] text-[#F2F4F6]">
          <User className="w-3 h-3 text-emerald-400" />
          <span className="font-semibold">Dr. E. Vance, MD</span>
          <span className="text-[#9EA4B5] hidden sm:inline">• CCU Attending</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1 rounded-[2px] border border-[#323D57] bg-[#131B2E] text-[#9EA4B5] hover:text-[#F2F4F6] transition-colors"
          type="button"
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
