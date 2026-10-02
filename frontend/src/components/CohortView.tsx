import React, { useState } from 'react';
import { PatientProfile, CohortStats, RiskState } from '../types/clinical';
import { Search, AlertTriangle, ShieldCheck, Activity, Users, Radio, ChevronRight, PlusCircle, ArrowUpDown, BellRing, Zap } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';

// ── Early-Warning Alert Panel ──────────────────────────────────────────────────
const EarlyWarningPanel: React.FC<{
  cohort: PatientProfile[];
  onSelectPatient: (id: number) => void;
}> = ({ cohort, onSelectPatient }) => {
  const alerts = cohort.filter((p) => p.latest_telemetry.state === 'decompensation');
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-[4px] border border-red-500/60 bg-red-950/20 p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <BellRing className="w-4 h-4 text-red-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider font-bold font-mono text-red-300">
          EARLY-WARNING ALERT SYSTEM — {alerts.length} PATIENT{alerts.length > 1 ? 'S' : ''} AT ACUTE DECOMPENSATION THRESHOLD
        </span>
        <span className="ml-auto text-[9px] font-mono text-red-400/70 border border-red-500/30 px-1.5 py-0.5 rounded-[2px]">
          24–48H HORIZON
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {alerts.map((p) => {
          const t = p.latest_telemetry;
          const risk = (t.risk_score * 100).toFixed(1);
          let topDriver = 'Multi-biomarker convergence';
          if (t.hrv_drop_from_baseline > 15)
            topDriver = `HRV ↓ ${t.hrv_drop_from_baseline.toFixed(1)} ms below baseline`;
          else if (t.resting_hr_rise_from_baseline > 10)
            topDriver = `RHR ↑ ${t.resting_hr_rise_from_baseline.toFixed(1)} bpm above baseline`;
          else if (t.sleep_drop_from_baseline > 1.5)
            topDriver = `Sleep ↓ ${t.sleep_drop_from_baseline.toFixed(1)} hrs below baseline`;

          return (
            <div
              key={p.ehr.patient_id}
              className="flex items-center justify-between bg-red-950/40 border border-red-500/40 rounded-[4px] p-2.5 gap-2 animate-pulse"
            >
              <PatientAvatar patientId={p.ehr.patient_id} name={p.ehr.name} size="sm" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] bg-red-900/60 text-red-200 border border-red-500/40 px-1 rounded-[2px]">
                    PT-{p.ehr.patient_id}
                  </span>
                  <span className="font-semibold text-red-100 truncate">{p.ehr.name}</span>
                  <span className="text-[10px] text-red-300 font-bold">{risk}%</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-red-300/80 truncate">
                  <Zap className="w-2.5 h-2.5 text-red-400 shrink-0" />
                  <span className="truncate">{topDriver}</span>
                </div>
                <div className="text-[9px] text-red-300/60 font-sans truncate">{p.ehr.diagnosis}</div>
              </div>
              <button
                onClick={() => onSelectPatient(p.ehr.patient_id)}
                className="shrink-0 px-2 py-1 bg-red-700/60 hover:bg-red-600/70 border border-red-400/60 text-red-100 text-[10px] font-mono font-bold rounded-[2px] flex items-center gap-1 transition-colors"
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


interface CohortViewProps {
  cohort: PatientProfile[];
  stats: CohortStats;
  onSelectPatient: (patientId: number) => void;
  onOpenDataIntake: () => void;
}

export const CohortView: React.FC<CohortViewProps> = ({
  cohort,
  stats,
  onSelectPatient,
  onOpenDataIntake,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'strain' | 'stable'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'id' | 'name'>('risk');

  // Filter patients
  const filteredPatients = cohort.filter((p) => {
    const latest = p.latest_telemetry;
    const matchesSearch =
      p.ehr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ehr.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `pt-${p.ehr.patient_id}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'critical') return latest.state === 'decompensation';
    if (selectedFilter === 'strain') return latest.state === 'strain';
    if (selectedFilter === 'stable') return latest.state === 'homeostasis';
    return true;
  });

  // Sort patients
  filteredPatients.sort((a, b) => {
    if (sortBy === 'risk') return b.latest_telemetry.risk_score - a.latest_telemetry.risk_score;
    if (sortBy === 'id') return a.ehr.patient_id - b.ehr.patient_id;
    return a.ehr.name.localeCompare(b.ehr.name);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Early-Warning Alert Panel — shown only when patients are in decompensation */}
      <EarlyWarningPanel cohort={cohort} onSelectPatient={onSelectPatient} />

      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Monitored Cohort */}
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9EA4B5]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">TOTAL MONITORED</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F2F4F6]">
              {stats.total_monitored}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">ACTIVE TWINS</span>
          </div>
        </div>

        {/* KPI 2: Critical Decompensation */}
        <div className="rounded-[4px] border border-red-500/40 bg-red-950/20 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-300">
            <span className="text-[10px] uppercase tracking-wider font-semibold">CRITICAL (NEXT 24–48H)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {stats.critical_count}
            </span>
            <span className="text-[10px] font-mono text-red-300">ACUTE HORIZON</span>
          </div>
        </div>

        {/* KPI 3: Autonomic Strain */}
        <div className="rounded-[4px] border border-amber-500/40 bg-amber-950/20 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[10px] uppercase tracking-wider font-semibold">AUTONOMIC STRAIN</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.warning_count}
            </span>
            <span className="text-[10px] font-mono text-amber-300">EARLY DRIFT</span>
          </div>
        </div>

        {/* KPI 4: Telemetry Uptime */}
        <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9EA4B5]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">SENSOR STREAM INTEGRITY</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.sync_uptime_pct}%
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
        <div className="flex items-center gap-1 font-mono text-[10px]">
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
            CRITICAL ({cohort.filter((p) => p.latest_telemetry.state === 'decompensation').length})
          </button>

          <button
            onClick={() => setSelectedFilter('strain')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'strain'
                ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold'
                : 'border-[#323D57] text-amber-400/80 hover:text-amber-300'
            }`}
          >
            STRAIN ({cohort.filter((p) => p.latest_telemetry.state === 'strain').length})
          </button>

          <button
            onClick={() => setSelectedFilter('stable')}
            className={`px-2.5 py-1 rounded-[2px] border transition-colors ${
              selectedFilter === 'stable'
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                : 'border-[#323D57] text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            STABLE ({cohort.filter((p) => p.latest_telemetry.state === 'homeostasis').length})
          </button>
        </div>

        {/* Action Button: Add New Record */}
        <button
          onClick={onOpenDataIntake}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 shadow-none transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>ADD NEW RECORD / TELEMETRY</span>
        </button>
      </div>

      {/* Patient Triage Table */}
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
                <th className="py-2.5 px-3">RESTING HR</th>
                <th className="py-2.5 px-3">BLOOD PRESSURE</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#323D57]/50 font-mono">
              {filteredPatients.map((p) => {
                const latest = p.latest_telemetry;
                const riskPct = (latest.risk_score * 100).toFixed(1);
                const isCritical = latest.state === 'decompensation';
                const isStrain = latest.state === 'strain';

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
                            style={{ width: `${Math.min(100, latest.risk_score * 100)}%` }}
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
                        {latest.state}
                      </span>
                    </td>

                    {/* HRV */}
                    <td className="py-2.5 px-3">
                      <span className={latest.hrv_mean < 25 ? 'text-red-400 font-bold' : latest.hrv_mean < 38 ? 'text-amber-400' : 'text-emerald-400'}>
                        {latest.hrv_mean.toFixed(1)} ms
                      </span>
                    </td>

                    {/* Resting HR */}
                    <td className="py-2.5 px-3">
                      <span className={latest.resting_hr_mean > 82 ? 'text-red-400 font-bold' : latest.resting_hr_mean > 74 ? 'text-amber-400' : 'text-[#F2F4F6]'}>
                        {latest.resting_hr_mean.toFixed(0)} bpm
                      </span>
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
    </div>
  );
};
