import React, { useState } from 'react';
import { PatientProfile, CohortStats, RiskState } from '../types/clinical';
import { Search, AlertTriangle, ShieldCheck, Activity, Users, Radio, ChevronRight, ChevronLeft, PlusCircle, ArrowUpDown, BellRing, Zap, RefreshCw, LayoutGrid, Table, HeartPulse } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

// ── Early-Warning Alert Panel (Connected to Real-Time Dynamic Telemetry) ──────
const EarlyWarningPanel: React.FC<{
  cohort: PatientProfile[];
  onSelectPatient: (id: number) => void;
}> = ({ cohort, onSelectPatient }) => {
  const { getPatientLiveTelemetry } = useLiveTelemetry();

  const alerts = cohort
    .map((p) => {
      const live = getPatientLiveTelemetry(p.ehr.patient_id, p.latest_telemetry, p.ehr);
      return { profile: p, live };
    })
    .filter(
      ({ live }) => live.instant_state === 'decompensation' || live.instant_risk_score >= 0.65
    );

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-[4px] border border-red-500/60 bg-red-950/20 p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2.5">
        <BellRing className="w-4 h-4 text-red-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider font-bold font-mono text-red-300">
          EARLY-WARNING ALERT SYSTEM — {alerts.length} PATIENT{alerts.length > 1 ? 'S' : ''} AT ACUTE DECOMPENSATION THRESHOLD
        </span>
        <span className="ml-auto text-[9px] font-mono text-red-400/80 border border-red-500/40 px-1.5 py-0.5 rounded-[2px] bg-red-950/40 font-bold">
          24–48H CRISIS HORIZON • 128 HZ STREAM
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {alerts.map(({ profile: p, live }) => {
          const t = p.latest_telemetry;
          const risk = (live.instant_risk_score * 100).toFixed(1);
          let topDriver = 'Multi-biomarker autonomic divergence';
          if (t.hrv_drop_from_baseline > 15)
            topDriver = `HRV ↓ ${t.hrv_drop_from_baseline.toFixed(1)} ms below baseline`;
          else if (t.resting_hr_rise_from_baseline > 10)
            topDriver = `RHR ↑ ${t.resting_hr_rise_from_baseline.toFixed(1)} bpm above baseline`;
          else if (t.sleep_drop_from_baseline > 1.5)
            topDriver = `Sleep ↓ ${t.sleep_drop_from_baseline.toFixed(1)} hrs below baseline`;

          return (
            <div
              key={p.ehr.patient_id}
              className="flex items-center justify-between bg-red-950/40 border border-red-500/40 rounded-[4px] p-2.5 gap-2 hover:border-red-400 transition-all"
            >
              <PatientAvatar patientId={p.ehr.patient_id} name={p.ehr.name} size="sm" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] bg-red-900/60 text-red-200 border border-red-500/40 px-1 rounded-[2px] font-bold">
                    PT-{p.ehr.patient_id}
                  </span>
                  <span className="font-semibold text-red-100 truncate">{p.ehr.name}</span>
                  <span className="text-[10px] text-red-300 font-bold ml-auto">{risk}%</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-red-300/80 truncate">
                  <Zap className="w-2.5 h-2.5 text-red-400 shrink-0" />
                  <span className="truncate">{topDriver}</span>
                </div>
                <div className="text-[9px] text-red-300/60 font-sans truncate">{p.ehr.diagnosis}</div>
              </div>
              <button
                onClick={() => onSelectPatient(p.ehr.patient_id)}
                className="shrink-0 px-2 py-1 bg-red-700/80 hover:bg-red-600 border border-red-400/60 text-red-100 text-[10px] font-mono font-bold rounded-[2px] flex items-center gap-1 transition-colors"
              >
                INSPECT
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Live Bedside Telemetry Monitor Card (Hospital ICU Central Station View) ───
const LiveWardCard: React.FC<{
  patient: PatientProfile;
  index: number;
  onSelect: (id: number) => void;
}> = ({ patient, index, onSelect }) => {
  const { getPatientLiveTelemetry } = useLiveTelemetry();
  const live = getPatientLiveTelemetry(patient.ehr.patient_id, patient.latest_telemetry, patient.ehr);

  const isCritical = live.instant_state === 'decompensation';
  const isStrain = live.instant_state === 'strain';
  const riskPct = (live.instant_risk_score * 100).toFixed(1);

  const cardBorder = isCritical
    ? 'border-red-500/60 bg-red-950/20 shadow-red-950/40 hover:border-red-400'
    : isStrain
    ? 'border-amber-500/50 bg-amber-950/15 hover:border-amber-400'
    : 'border-[#323D57] bg-[#131B2E] hover:border-emerald-500/40';

  const badgeBg = isCritical
    ? 'bg-red-950/80 text-red-300 border-red-500/50'
    : isStrain
    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';

  // SVG mini-ECG trace generator from live waveform sample
  const points = live.waveform_sample
    .map((v, i) => `${(i / 15) * 120},${18 - v * 12}`)
    .join(' ');

  return (
    <div
      onClick={() => onSelect(patient.ehr.patient_id)}
      className={`rounded-[4px] border p-3 cursor-pointer transition-all flex flex-col justify-between gap-2.5 hover:shadow-lg ${cardBorder}`}
    >
      {/* Top row: Bed #, Patient ID, State Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[10px] px-1 py-0.5 rounded-[2px] bg-[#0A0E18] text-[#9EA4B5] border border-[#323D57]">
            BED {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">PT-{patient.ehr.patient_id}</span>
        </div>
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[12px] border uppercase tracking-wider ${badgeBg}`}>
          {isCritical ? 'CRITICAL' : isStrain ? 'STRAIN' : 'STABLE'}
        </span>
      </div>

      {/* Patient Name & Demographics */}
      <div className="flex items-center gap-2">
        <PatientAvatar patientId={patient.ehr.patient_id} name={patient.ehr.name} size="sm" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#F2F4F6] truncate">{patient.ehr.name}</div>
          <div className="text-[10px] text-[#9EA4B5] truncate">
            {patient.ehr.age}{patient.ehr.sex} • {patient.ehr.diagnosis}
          </div>
        </div>
      </div>

      {/* Live Vitals Cluster */}
      <div className="bg-[#0A0E18] p-2 rounded-[2px] border border-[#323D57]/60 flex items-center justify-between gap-2 font-mono">
        {/* Instantaneous BPM */}
        <div>
          <div className="text-[9px] text-[#9EA4B5] flex items-center gap-1">
            <HeartPulse className={`w-3 h-3 ${isCritical ? 'text-red-400 animate-bounce' : isStrain ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>INSTANT HR</span>
          </div>
          <div className="text-xl font-bold text-[#F2F4F6] flex items-baseline gap-1">
            {live.instant_bpm}
            <span className="text-[9px] text-[#9EA4B5] font-normal">BPM</span>
          </div>
        </div>

        {/* Mini ECG Trace */}
        <div className="flex-1 max-w-[110px] h-8 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 120 36">
            <polyline
              fill="none"
              stroke={isCritical ? '#F87171' : isStrain ? '#FBBF24' : '#34D399'}
              strokeWidth="1.8"
              points={points}
            />
          </svg>
        </div>

        {/* Live HRV */}
        <div className="text-right">
          <div className="text-[9px] text-[#9EA4B5]">HRV (RMSSD)</div>
          <div className={`text-sm font-bold ${live.instant_hrv < 25 ? 'text-red-400' : live.instant_hrv < 38 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {live.instant_hrv} <span className="text-[9px] font-normal">ms</span>
          </div>
        </div>
      </div>

      {/* Bottom row: SpO2, BP, 24h Risk, Inspect */}
      <div className="flex items-center justify-between font-mono text-[10px] pt-1 border-t border-[#323D57]/50">
        <div className="flex items-center gap-2 text-[#9EA4B5]">
          <span>SpO2: <strong className="text-[#F2F4F6]">{live.instant_spo2}%</strong></span>
          <span>BP: <strong className="text-[#F2F4F6]">{patient.ehr.systolic_bp}/{patient.ehr.diastolic_bp}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-bold ${isCritical ? 'text-red-400' : isStrain ? 'text-amber-400' : 'text-emerald-400'}`}>
            {riskPct}% RISK
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#9EA4B5]" />
        </div>
      </div>
    </div>
  );
};



interface CohortViewProps {
  cohort: PatientProfile[];
  stats: CohortStats;
  onSelectPatient: (patientId: number) => void;
  onOpenDataIntake: () => void;
  onRefresh?: () => void;
}

export const CohortView: React.FC<CohortViewProps> = ({
  cohort,
  stats,
  onSelectPatient,
  onOpenDataIntake,
  onRefresh,
}) => {
  const { getPatientLiveTelemetry, isLiveMode } = useLiveTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'strain' | 'stable' | 'hypertension' | 'cardiovascular'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'id' | 'name'>('risk');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 24;

  // Filter patients
  const filteredPatients = cohort.filter((p) => {
    const live = getPatientLiveTelemetry(p.ehr.patient_id, p.latest_telemetry, p.ehr);
    const latest = p.latest_telemetry;
    const activeRisk = isLiveMode ? live.instant_risk_score : latest.risk_score;
    const activeState = isLiveMode ? live.instant_state : latest.state;

    const matchesSearch =
      p.ehr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ehr.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `pt-${p.ehr.patient_id}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'critical') return activeState === 'decompensation' || activeRisk >= 0.65;
    if (selectedFilter === 'strain') return activeState === 'strain' || (activeRisk >= 0.25 && activeRisk < 0.65);
    if (selectedFilter === 'stable') return activeState === 'homeostasis' && activeRisk < 0.25;
    if (selectedFilter === 'hypertension') return p.ehr.diagnosis.toLowerCase().includes('hypertension');
    if (selectedFilter === 'cardiovascular') return p.ehr.diagnosis.toLowerCase().includes('cardiovascular');
    return true;
  });

  // Sort patients
  filteredPatients.sort((a, b) => {
    if (sortBy === 'risk') {
      const liveA = getPatientLiveTelemetry(a.ehr.patient_id, a.latest_telemetry, a.ehr);
      const liveB = getPatientLiveTelemetry(b.ehr.patient_id, b.latest_telemetry, b.ehr);
      return liveB.instant_risk_score - liveA.instant_risk_score;
    }
    if (sortBy === 'id') return a.ehr.patient_id - b.ehr.patient_id;
    return a.ehr.name.localeCompare(b.ehr.name);
  });

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE) || 1;
  const pagedPatients = filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Early-Warning Alert Panel — shown when patients are in acute decompensation */}
      <EarlyWarningPanel cohort={cohort} onSelectPatient={onSelectPatient} />

      {/* Top Banner & KPI Stat Cards with Click-to-Filter Action */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Monitored Cohort */}
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`rounded-[4px] border p-3 flex flex-col justify-between text-left transition-all ${
            selectedFilter === 'all'
              ? 'border-[#7C839B] bg-[#161E31] ring-1 ring-[#7C839B]'
              : 'border-[#323D57] bg-[#131B2E] hover:border-[#7C839B]/60'
          }`}
        >
          <div className="flex items-center justify-between text-[#9EA4B5] w-full">
            <span className="text-[10px] uppercase tracking-wider font-semibold">TOTAL MONITORED</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F2F4F6]">
              {stats.total_monitored}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">ACTIVE TWINS</span>
          </div>
        </button>

        {/* KPI 2: Critical Decompensation */}
        <button
          type="button"
          onClick={() => setSelectedFilter('critical')}
          className={`rounded-[4px] border p-3 flex flex-col justify-between text-left transition-all ${
            selectedFilter === 'critical'
              ? 'border-red-400 bg-red-950/40 ring-1 ring-red-400'
              : 'border-red-500/40 bg-red-950/20 hover:border-red-400/80'
          }`}
        >
          <div className="flex items-center justify-between text-red-300 w-full">
            <span className="text-[10px] uppercase tracking-wider font-semibold">CRITICAL (NEXT 24–48H)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {stats.critical_count}
            </span>
            <span className="text-[10px] font-mono text-red-300">ACUTE ALERTS</span>
          </div>
        </button>

        {/* KPI 3: Autonomic Strain */}
        <button
          type="button"
          onClick={() => setSelectedFilter('strain')}
          className={`rounded-[4px] border p-3 flex flex-col justify-between text-left transition-all ${
            selectedFilter === 'strain'
              ? 'border-amber-400 bg-amber-950/40 ring-1 ring-amber-400'
              : 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400/80'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 w-full">
            <span className="text-[10px] uppercase tracking-wider font-semibold">AUTONOMIC STRAIN</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.warning_count}
            </span>
            <span className="text-[10px] font-mono text-amber-300">EARLY DRIFT</span>
          </div>
        </button>

        {/* KPI 4: Telemetry Uptime */}
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9EA4B5]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">SENSOR STREAM INTEGRITY</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {typeof stats.sync_uptime_pct === 'number' ? stats.sync_uptime_pct.toFixed(1) : stats.sync_uptime_pct}%
            </span>
            <span className="text-[10px] font-mono text-[#9EA4B5]">BLE LIVE SYNC</span>
          </div>
        </div>
      </div>


      {/* Cohort Control Bar: Search, Filters, and "Add New Record" Button */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#9EA4B5]" />
          <input
            type="text"
            placeholder="Search patient ID, name, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0A0E18] border border-[#323D57] pl-8 pr-3 py-1.5 rounded-[2px] text-xs font-mono text-[#F2F4F6] placeholder-[#9EA4B5]/60 focus:outline-none focus:border-[#7C839B]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 font-mono text-[10px] flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'all'
                ? 'bg-[#161E31] border-[#7C839B] text-[#F2F4F6] font-bold'
                : 'border-[#323D57] text-[#9EA4B5] hover:text-[#F2F4F6]'
            }`}
          >
            ALL ({cohort.length})
          </button>

          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'critical'
                ? 'bg-red-950/70 border-red-500 text-red-300 font-bold'
                : 'border-[#323D57] text-red-400/80 hover:text-red-300'
            }`}
          >
            CRITICAL ({stats.critical_count})
          </button>

          <button
            onClick={() => setSelectedFilter('strain')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'strain'
                ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold'
                : 'border-[#323D57] text-amber-400/80 hover:text-amber-300'
            }`}
          >
            STRAIN ({stats.warning_count})
          </button>

          <button
            onClick={() => setSelectedFilter('stable')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'stable'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                : 'border-[#323D57] text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            STABLE ({stats.stable_count})
          </button>

          <button
            onClick={() => setSelectedFilter('hypertension')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'hypertension'
                ? 'bg-blue-950/70 border-blue-500 text-blue-300 font-bold'
                : 'border-[#323D57] text-blue-400/80 hover:text-blue-300'
            }`}
          >
            HYPERTENSION ({stats.hypertension_count ?? 0})
          </button>

          <button
            onClick={() => setSelectedFilter('cardiovascular')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'cardiovascular'
                ? 'bg-purple-950/70 border-purple-500 text-purple-300 font-bold'
                : 'border-[#323D57] text-purple-400/80 hover:text-purple-300'
            }`}
          >
            CARDIO RISK ({stats.cardiovascular_risk_count ?? 0})
          </button>
        </div>

        {/* Layout Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Live ICU Ward Grid vs Clinical Table */}
          <div className="flex items-center gap-1 bg-[#0A0E18] p-0.5 rounded-[2px] border border-[#323D57] font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`px-2.5 py-1 rounded-[2px] flex items-center gap-1 font-bold transition-colors ${
                viewLayout === 'grid'
                  ? 'bg-[#161E31] text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
              }`}
            >
              <LayoutGrid className="w-3 h-3 text-emerald-400" />
              <span>LIVE ICU WARD GRID</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1 rounded-[2px] flex items-center gap-1 font-bold transition-colors ${
                viewLayout === 'table'
                  ? 'bg-[#161E31] text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
              }`}
            >
              <Table className="w-3 h-3 text-sky-400" />
              <span>CLINICAL TABLE</span>
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-2.5 py-1.5 bg-[#161E31] hover:bg-[#1C263D] border border-[#323D57] hover:border-[#7C839B] text-[#F2F4F6] rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              title="Refresh Cohort Telemetry from Backend"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#9EA4B5]" />
              <span>SYNC REFRESH</span>
            </button>
          )}

          <button
            onClick={onOpenDataIntake}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 shadow-none transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>ADD NEW RECORD / TELEMETRY</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Either Live ICU Ward Telemetry Grid or Clinical Table */}
      {viewLayout === 'grid' ? (
        <div className="flex flex-col gap-3">
          {/* Grid of Bedside Monitors with Real-Time Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pagedPatients.map((p, idx) => (
              <LiveWardCard
                key={p.ehr.patient_id}
                patient={p}
                index={(page - 1) * PAGE_SIZE + idx}
                onSelect={onSelectPatient}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between font-mono text-xs bg-[#131B2E] border border-[#323D57] p-2.5 rounded-[4px]">
              <div className="text-[#9EA4B5] text-[11px]">
                SHOWING {((page - 1) * PAGE_SIZE) + 1} - {Math.min(filteredPatients.length, page * PAGE_SIZE)} OF {filteredPatients.length} MONITORED TWINS
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-2 py-1 bg-[#161E31] border border-[#323D57] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C263D] text-[#F2F4F6] rounded-[2px] flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV</span>
                </button>
                <span className="px-2 text-emerald-400 font-bold">PAGE {page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-2 py-1 bg-[#161E31] border border-[#323D57] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1C263D] text-[#F2F4F6] rounded-[2px] flex items-center gap-1"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* View B: Clinical Triage Table (Enhanced with Live Telemetry Columns) */
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0A0E18] border-b border-[#323D57] text-[10px] font-mono uppercase text-[#9EA4B5]">
                  <th className="py-2.5 px-3">PATIENT</th>
                  <th className="py-2.5 px-3">PRIMARY DIAGNOSIS</th>
                  <th className="py-2.5 px-3">24-48H RISK</th>
                  <th className="py-2.5 px-3">TWIN STATE</th>
                  <th className="py-2.5 px-3">HRV (RMSSD)</th>
                  <th className="py-2.5 px-3">INSTANT HR (LIVE)</th>
                  <th className="py-2.5 px-3">BLOOD PRESSURE</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#323D57]/50 font-mono">
                {filteredPatients.map((p) => {
                  const live = getPatientLiveTelemetry(p.ehr.patient_id, p.latest_telemetry, p.ehr);
                  const latest = p.latest_telemetry;
                  const activeRisk = isLiveMode ? live.instant_risk_score : latest.risk_score;
                  const activeState = isLiveMode ? live.instant_state : latest.state;
                  const activeBpm = isLiveMode ? live.instant_bpm : Math.round(latest.resting_hr_mean + 12);
                  const activeHrv = isLiveMode ? live.instant_hrv : latest.hrv_mean;

                  const riskPct = (activeRisk * 100).toFixed(1);
                  const isCritical = activeState === 'decompensation';
                  const isStrain = activeState === 'strain';

                  return (
                    <tr
                      key={p.ehr.patient_id}
                      onClick={() => onSelectPatient(p.ehr.patient_id)}
                      className="hover:bg-[#161E31] cursor-pointer transition-colors"
                    >
                      {/* Patient ID & Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#F2F4F6] flex items-center gap-2">
                          <PatientAvatar patientId={p.ehr.patient_id} name={p.ehr.name} size="sm" />
                          <span className="px-1.5 py-0.2 bg-[#0A0E18] border border-[#323D57] rounded-[2px] text-[10px] text-[#9EA4B5]">
                            PT-{p.ehr.patient_id}
                          </span>
                          <span>{p.ehr.name}</span>
                          <span className="text-[10px] text-[#9EA4B5] font-normal">
                            ({p.ehr.age}{p.ehr.sex})
                          </span>
                        </div>
                      </td>

                      {/* Diagnosis */}
                      <td className="py-2.5 px-3 text-[#9EA4B5] font-sans text-xs">
                        {p.ehr.diagnosis}
                      </td>

                      {/* 24-48h Risk Probability Bar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isCritical ? 'text-red-400' : isStrain ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {riskPct}%
                          </span>
                          <div className="w-16 h-1.5 bg-[#0A0E18] rounded-[2px] overflow-hidden">
                            <div
                              className={`h-full rounded-[1px] ${isCritical ? 'bg-red-500' : isStrain ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, activeRisk * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Twin State Pill */}
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-[12px] border text-[9px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-950/60 text-red-300 border-red-500/40'
                            : isStrain
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {activeState}
                        </span>
                      </td>

                      {/* HRV */}
                      <td className="py-2.5 px-3">
                        <span className={activeHrv < 25 ? 'text-red-400 font-bold' : activeHrv < 38 ? 'text-amber-400' : 'text-emerald-400'}>
                          {activeHrv} ms
                        </span>
                      </td>

                      {/* Resting / Instant HR */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={activeBpm > 88 ? 'text-red-400 font-bold' : activeBpm > 76 ? 'text-amber-400' : 'text-[#F2F4F6]'}>
                            {activeBpm} bpm
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                      </td>

                      {/* BP */}
                      <td className="py-2.5 px-3 text-[#F2F4F6]">
                        {p.ehr.systolic_bp}/{p.ehr.diastolic_bp} mmHg
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(p.ehr.patient_id);
                          }}
                          className="px-2 py-1 bg-[#161E31] hover:bg-[#1C263D] border border-[#323D57] rounded-[2px] text-[10px] text-[#F2F4F6] font-semibold inline-flex items-center gap-1"
                        >
                          <span>INSPECT TWIN</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
