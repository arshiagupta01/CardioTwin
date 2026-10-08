import React from 'react';
import { PatientEHR } from '../types/clinical';
import { FileText, Heart, Activity, Pill, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { ClinicalTooltip } from './ClinicalTooltip';

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
          <ClinicalTooltip
            term="STATIC EHR BASELINE & LAB PROFILE"
            definition="Hospital electronic health record baselines including hemodynamics, lipid panels, and glycemic status."
            clinicalSignificance="Provides baseline physiological substrate to contextualize wearable biosensor changes."
          >
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#F2F4F6]">
              STATIC EHR BASELINE & LAB PROFILE
            </h3>
          </ClinicalTooltip>
        </div>
        <span className="text-[10px] font-mono text-[#9EA4B5]">HOSPITAL EHR SYNCED</span>
      </div>

      {/* Blood Pressure Card with MAP and Stage */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <div className="flex items-center justify-between mb-2">
          <ClinicalTooltip
            term="VASCULAR LOAD // BLOOD PRESSURE"
            definition="Arterial pressure during ventricular contraction (systolic) and relaxation (diastolic)."
            normalRange="< 120/80 mmHg"
            clinicalSignificance="Elevated pressure increases left ventricular wall tension and accelerates vascular damage."
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5]">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              VASCULAR LOAD // BLOOD PRESSURE
            </div>
          </ClinicalTooltip>
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
            <ClinicalTooltip
              term="MEAN ARTERIAL PRESSURE (MAP)"
              definition="Average arterial perfusion pressure across the cardiac cycle: (2 * Diastolic + Systolic) / 3."
              normalRange="70 - 100 mmHg"
              clinicalSignificance="Critical indicator of vital organ perfusion. Levels < 65 mmHg indicate shock; > 105 mmHg indicates acute vascular strain."
            >
              <span className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">MEAN ARTERIAL (MAP)</span>
            </ClinicalTooltip>
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
        <ClinicalTooltip
          term="LIPID PANEL & ATHEROSCLEROTIC PROFILE"
          definition="Serum lipoprotein concentrations measuring cholesterol distribution and coronary plaque formation risk."
          clinicalSignificance="Guides statin titration and preventative lipid-lowering pharmacotherapy."
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            LIPID PANEL & ATHEROSCLEROTIC PROFILE
          </div>
        </ClinicalTooltip>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="TOTAL CHOLESTEROL"
              definition="Cumulative sum of circulating blood cholesterol including LDL, HDL, and VLDL fractions."
              normalRange="< 200 mg/dL"
              clinicalSignificance="Elevated total cholesterol promotes systemic atherosclerosis."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">TOTAL CHOL</div>
            </ClinicalTooltip>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.cholesterol > 200 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.cholesterol}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &lt;200 mg/dL</div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="LOW-DENSITY LIPOPROTEIN (LDL-C)"
              definition="Primary atherogenic lipoprotein responsible for subintimal cholesterol deposition in coronary arteries."
              normalRange="< 100 mg/dL (< 70 for high risk)"
              clinicalSignificance="Chief modifiable target for coronary artery disease prevention."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">LDL-C (ATHERO)</div>
            </ClinicalTooltip>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.ldl > 100 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.ldl}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &lt;100 mg/dL</div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="HIGH-DENSITY LIPOPROTEIN (HDL-C)"
              definition="Cardioprotective lipoprotein facilitating reverse cholesterol transport back to the liver."
              normalRange="> 40 mg/dL (Men) / > 50 mg/dL (Women)"
              clinicalSignificance="Protects against atherosclerotic plaque accumulation."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">HDL (CARDIO-PROT)</div>
            </ClinicalTooltip>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.hdl < 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {ehr.hdl}
            </div>
            <div className="text-[8px] font-mono text-[#9EA4B5]">ref &gt;40 mg/dL</div>
          </div>
        </div>
      </div>

      {/* Glycemic & Cardiometabolic Markers */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <ClinicalTooltip
          term="GLYCEMIC & METABOLIC STATUS"
          definition="Circulating glucose biomarkers assessing carbohydrate metabolism and diabetic cardiovascular complications."
          clinicalSignificance="Diabetes significantly accelerates cardiovascular calcification and heart failure risk."
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-purple-400" />
            GLYCEMIC & METABOLIC STATUS
          </div>
        </ClinicalTooltip>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="FASTING BLOOD GLUCOSE"
              definition="Blood glucose concentration following an overnight fast of 8+ hours."
              normalRange="70 - 99 mg/dL"
              clinicalSignificance="Values >= 126 mg/dL indicate uncontrolled diabetes."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">FASTING GLUCOSE</div>
            </ClinicalTooltip>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.fasting_glucose > 100 ? 'text-amber-400' : 'text-[#F2F4F6]'}`}>
              {ehr.fasting_glucose} <span className="text-[9px] font-normal text-[#9EA4B5]">mg/dL</span>
            </div>
          </div>

          <div className="bg-[#161E31] p-2 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="GLYCATED HEMOGLOBIN (HbA1c)"
              definition="Percentage of glycosylated hemoglobin reflecting mean blood glucose over the preceding 90-120 days."
              normalRange="< 5.7% (Normal), >= 6.5% (Diabetic)"
              clinicalSignificance="Uncontrolled HbA1c is strongly correlated with diabetic cardiomyopathy and microvascular disease."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase tracking-wider text-[#9EA4B5]">GLYCATED HbA1c</div>
            </ClinicalTooltip>
            <div className={`text-sm font-mono font-bold mt-0.5 ${ehr.hba1c > 6.5 ? 'text-red-400' : 'text-[#F2F4F6]'}`}>
              {ehr.hba1c}% <span className="text-[9px] font-normal text-[#9EA4B5]">{ehr.hba1c > 6.5 ? '(Diabetic)' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comorbidities & Risk Factors */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <ClinicalTooltip
          term="CARDIOVASCULAR COMORBIDITIES"
          definition="Documented baseline chronic conditions that compound adverse cardiovascular outcomes."
          clinicalSignificance="Multiplies lifetime risk of heart failure hospitalization and ischemic events."
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2">
            DOCUMENTED COMORBIDITIES & RISK FACTORS
          </div>
        </ClinicalTooltip>
        <div className="flex flex-wrap gap-1.5">
          <ClinicalTooltip
            term="STAGE 2 HYPERTENSION"
            definition="Systolic BP >= 140 mmHg or Diastolic BP >= 90 mmHg."
            clinicalSignificance="Requires aggressive multi-drug combination therapy to avoid hypertensive emergency."
            hideIcon={true}
          >
            <span className="px-2 py-0.5 bg-red-950/50 text-red-300 border border-red-500/40 rounded-[2px] text-[10px] font-mono">
              STAGE 2 HTN
            </span>
          </ClinicalTooltip>

          {ehr.diabetes === 1 && (
            <ClinicalTooltip
              term="TYPE 2 DIABETES"
              definition="Chronic insulin resistance causing persistent vascular inflammation and myocardial stiffness."
              clinicalSignificance="Doubles the risk of acute decompensated heart failure."
              hideIcon={true}
            >
              <span className="px-2 py-0.5 bg-amber-950/50 text-amber-300 border border-amber-500/40 rounded-[2px] text-[10px] font-mono">
                TYPE 2 DIABETES
              </span>
            </ClinicalTooltip>
          )}

          {ehr.smoker === 1 && (
            <ClinicalTooltip
              term="TOBACCO EXPOSURE"
              definition="Past or current cigarette smoking history with cumulative pack-year burden."
              clinicalSignificance="Promotes endothelial dysfunction, platelet aggregation, and coronary spasms."
              hideIcon={true}
            >
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-600 rounded-[2px] text-[10px] font-mono">
                FORMER SMOKER (15 PACK-YR)
              </span>
            </ClinicalTooltip>
          )}

          {ehr.family_history === 1 && (
            <ClinicalTooltip
              term="FAMILY HISTORY OF CAD"
              definition="Premature coronary artery disease in first-degree relatives (< 55 in men, < 65 in women)."
              clinicalSignificance="Strong genetic predisposition for accelerated atherosclerotic plaque progression."
              hideIcon={true}
            >
              <span className="px-2 py-0.5 bg-purple-950/50 text-purple-300 border border-purple-500/40 rounded-[2px] text-[10px] font-mono">
                FAMILY HX PREMATURE CAD
              </span>
            </ClinicalTooltip>
          )}
        </div>
      </div>

      {/* Active Prescribed Medication Regimen */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-3">
        <ClinicalTooltip
          term="ACTIVE PHARMACOTHERAPY"
          definition="Currently prescribed cardiovascular and metabolic drugs."
          clinicalSignificance="Assessing drug regimen helps detect gaps in Guideline-Directed Medical Therapy (GDMT)."
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-emerald-400" />
            ACTIVE PHARMACOTHERAPY REGIMEN
          </div>
        </ClinicalTooltip>
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
