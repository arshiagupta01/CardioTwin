import React from 'react';
import { PatientEHR } from '../types/clinical';
import { FileText, Heart, Activity, Pill, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface EhrProfileColProps {
  ehr: PatientEHR;
}

export const EhrProfileCol: React.FC<EhrProfileColProps> = ({ ehr }) => {
  // Mean Arterial Pressure (MAP) = (2 * Diastolic + Systolic) / 3
  const mapValue = Math.round((2 * ehr.diastolic_bp + ehr.systolic_bp) / 3);

  // HTN Stage classification
  const htnStage =
    ehr.systolic_bp >= 140 || ehr.diastolic_bp >= 90
      ? { label: 'STAGE 2 HYPERTENSION', color: 'text-red-400 bg-red-950/40 border-red-500/40' }
      : ehr.systolic_bp >= 130 || ehr.diastolic_bp >= 80
      ? { label: 'STAGE 1 HYPERTENSION', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' }
      : { label: 'NORMAL BLOOD PRESSURE', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' };

  return (
    <div className="flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#323D57] pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-[#F2F4F6]">
            STATIC EHR BASELINE & LAB PROFILE
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#9EA4B5]">HOSPITAL EHR SYNCED</span>
      </div>

      {/* Blood Pressure Card with MAP and Stage */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            VASCULAR LOAD // BLOOD PRESSURE
          </div>
          <span className={`px-2 py-0.5 rounded-[12px] border text-[9px] font-mono font-bold ${htnStage.color}`}>
            {htnStage.label}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <span className="text-2xl font-bold font-mono text-[#F2F4F6]">
              {ehr.systolic_bp}
            </span>
            <span className="text-lg font-mono text-[#9EA4B5]">/</span>
            <span className="text-xl font-bold font-mono text-[#F2F4F6]">
              {ehr.diastolic_bp}
            </span>
            <span className="text-xs font-mono text-[#9EA4B5] ml-1.5">mmHg</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">MEAN ARTERIAL (MAP)</span>
            <div className="text-sm font-bold font-mono text-amber-300">
              {mapValue} <span className="text-[9px] font-normal text-[#9EA4B5]">mmHg</span>
            </div>
          </div>
        </div>

        {/* BP Bar Scale */}
        <div className="w-full h-1.5 bg-[#0A0E18] rounded-[2px] mt-2 overflow-hidden flex border border-[#323D57]/40">
          <div className="w-1/3 bg-emerald-500 h-full" title="Normal <120" />
          <div className="w-1/3 bg-amber-400 h-full" title="Elevated 120-139" />
          <div className="w-1/3 bg-red-500 h-full" title="Stage 2 >140" />
        </div>
      </div>

      {/* Lipid Panel */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          LIPID PANEL & ATHEROSCLEROTIC PROFILE
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">TOTAL CHOL</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.cholesterol > 200 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.cholesterol}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &lt;200 mg/dL</div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">LDL-C (ATHERO)</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.ldl > 100 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.ldl}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &lt;100 mg/dL</div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">HDL (CARDIO-PROT)</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.hdl < 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {ehr.hdl}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &gt;40 mg/dL</div>
          </div>
        </div>
      </div>

      {/* Glycemic & Cardiometabolic Markers */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-purple-400" />
          GLYCEMIC & METABOLIC STATUS
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">FASTING GLUCOSE</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.fasting_glucose > 100 ? 'text-amber-400' : 'text-[#F2F4F6]'}`}>
              {ehr.fasting_glucose} <span className="text-[9px] font-normal text-[#9EA4B5]">mg/dL</span>
            </div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">GLYCATED HbA1c</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.hba1c > 6.5 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.hba1c}% <span className="text-[9px] font-normal text-[#9EA4B5]">{ehr.hba1c > 6.5 ? '(Diabetic)' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comorbidities & Risk Factors */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2">
          DOCUMENTED COMORBIDITIES & RISK FACTORS
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-red-950/50 text-red-300 border border-red-500/40 rounded-[2px] text-[10px] font-mono">
            STAGE 2 HTN
          </span>
          {ehr.diabetes === 1 && (
            <span className="px-2 py-0.5 bg-amber-950/50 text-amber-300 border border-amber-500/40 rounded-[2px] text-[10px] font-mono">
              TYPE 2 DIABETES
            </span>
          )}
          {ehr.smoker === 1 && (
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-600 rounded-[2px] text-[10px] font-mono">
              FORMER SMOKER (15 PACK-YR)
            </span>
          )}
          {ehr.family_history === 1 && (
            <span className="px-2 py-0.5 bg-purple-950/50 text-purple-300 border border-purple-500/40 rounded-[2px] text-[10px] font-mono">
              FAMILY HX PREMATURE CAD
            </span>
          )}
        </div>
      </div>

      {/* Active Prescribed Medication Regimen */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5 text-emerald-400" />
          ACTIVE PHARMACOTHERAPY REGIMEN
        </div>
        <ul className="space-y-1.5 text-xs font-mono">
          {ehr.medications.map((med, idx) => (
            <li key={idx} className="flex items-center gap-2 p-1.5 bg-[#161E31] rounded-[2px] border border-[#323D57]/40 text-[#F2F4F6]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{med}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
