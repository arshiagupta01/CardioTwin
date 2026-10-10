import React, { useState } from 'react';
import { PatientProfile, CohortStats, RiskState } from '../types/clinical';
import { Search, AlertTriangle, ShieldCheck, Activity, Users, Radio, ChevronRight, PlusCircle, ArrowUpDown, BellRing, Zap, RefreshCw } from 'lucide-react';
import { PatientAvatar } from './PatientAvatar';

// ── Early-Warning Alert Panel ──────────────────────────────────────────────────
const EarlyWarningPanel: React.FC<{
  cohort: PatientProfile[];
  onSelectPatient: (id: number) => void;
}> = ({ cohort, onSelectPatient }) => {
  const alerts = cohort.filter(
    (p) => p.latest_telemetry.state === 'decompensation' || p.latest_telemetry.risk_score >= 0.65
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
          24–48H CRISIS HORIZON
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'strain' | 'stable' | 'hypertension' | 'cardiovascular'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'id' | 'name'>('risk');

  // Filter patients
  const filteredPatients = cohort.filter((p) => {
    const latest = p.latest_telemetry;
    const matchesSearch =
      p.ehr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ehr.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `pt-${p.ehr.patient_id}`.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'critical') return latest.state === 'decompensation' || latest.risk_score >= 0.65;
    if (selectedFilter === 'strain') return latest.state === 'strain' || (latest.risk_score >= 0.25 && latest.risk_score < 0.65);
    if (selectedFilter === 'stable') return latest.state === 'homeostasis' && latest.risk_score < 0.25;
    if (selectedFilter === 'hypertension') return p.ehr.diagnosis.toLowerCase().includes('hypertension');
    if (selectedFilter === 'cardiovascular') return p.ehr.diagnosis.toLowerCase().includes('cardiovascular');
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
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.sync_uptime_pct == null ? 'N/A' : `${stats.sync_uptime_pct.toFixed(1)}%`}
            </span>
            <span className="text-[10px] font-mono text-[#9EA4B5]">DEVICE SYNC REPORTED</span>
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

        {/* Action Buttons: Refresh & Add Record */}
        <div className="flex items-center gap-2">
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
