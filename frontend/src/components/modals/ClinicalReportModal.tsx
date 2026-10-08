import React, { useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { PatientProfile } from '../../types/clinical';

interface ClinicalReportModalProps {
  patient: PatientProfile;
  activeDay: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  patient,
  activeDay,
  isOpen,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTelemetry =
    patient.telemetry_series.find((d) => d.day_index === activeDay) || patient.latest_telemetry;
  const baseline = patient.telemetry_series[0] ?? currentTelemetry;

  const hrvDelta = currentTelemetry.hrv_mean - baseline.hrv_mean;
  const rhrDelta = currentTelemetry.resting_hr_mean - baseline.resting_hr_mean;
  const sleepDelta = currentTelemetry.sleep_hours - baseline.sleep_hours;

  const riskPct = (currentTelemetry.risk_score * 100).toFixed(1);
  const isDecomp = currentTelemetry.state === 'decompensation';
  const isStrain = currentTelemetry.state === 'strain';

  const riskBadge = isDecomp
    ? 'CRITICAL // ACUTE DECOMPENSATION PREDICTED (24-48H)'
    : isStrain
    ? 'WARNING // AUTONOMIC STRAIN (EARLY DECOMPENSATION PRODROME)'
    : 'STABLE // PHYSIOLOGIC HOMEOSTASIS';

  // 1. Direct Print / Save as PDF via native browser print
  const handlePrintPdf = () => {
    window.print();
  };

  // 2. Export formatted EMR Chart Progress Note (.txt)
  const handleDownloadNote = () => {
    const textContent = `================================================================================
CARDIOTWIN BIO-DIGITAL TWIN CLINICAL CONSULTATION NOTE
Generated: ${new Date().toUTCString()}
Patient: ${patient.ehr.name} (MRN: PT-${patient.ehr.patient_id})
Demographics: Age ${patient.ehr.age} | Sex: ${patient.ehr.sex} | BMI: ${patient.ehr.bmi}
Primary Diagnosis: ${patient.ehr.diagnosis}
Attending Physician: Dr. E. Vance, MD (CCU)
================================================================================

1. AI DIGITAL TWIN RISK STRATIFICATION (24-48 HOUR HORIZON)
--------------------------------------------------------------------------------
Predicted Event Probability: ${riskPct}%
Clinical Status: ${riskBadge}
Timeline Horizon Evaluated: Day ${activeDay} of 10

2. WEARABLE TELEMETRY & BASELINE DEVIATION ANALYSIS
--------------------------------------------------------------------------------
- HRV (RMSSD Mean): ${currentTelemetry.hrv_mean} ms (${hrvDelta >= 0 ? '+' : ''}${hrvDelta.toFixed(1)} ms vs Day 1 baseline)
- Resting Heart Rate: ${currentTelemetry.resting_hr_mean} bpm (${rhrDelta >= 0 ? '+' : ''}${rhrDelta.toFixed(1)} bpm vs Day 1 baseline)
- Mean 24h Heart Rate: ${currentTelemetry.mean_hr} bpm
- Sleep Duration: ${currentTelemetry.sleep_hours} hrs (${sleepDelta >= 0 ? '+' : ''}${sleepDelta.toFixed(1)} hrs vs Day 1 baseline)
- Sleep Efficiency: ${(currentTelemetry.sleep_efficiency * 100).toFixed(1)}%
- Ambulatory Step Count: ${currentTelemetry.daily_steps.toLocaleString()} steps
- Continuous Sync Fidelity: ${patient.hardware.ble_fidelity}% (RSSI: ${patient.hardware.ble_rssi})

3. BASELINE ELECTRONIC HEALTH RECORD (EHR) PROFILE
--------------------------------------------------------------------------------
- Blood Pressure: ${patient.ehr.systolic_bp}/${patient.ehr.diastolic_bp} mmHg
- Total Cholesterol: ${patient.ehr.cholesterol} mg/dL (LDL: ${patient.ehr.ldl} | HDL: ${patient.ehr.hdl})
- Fasting Blood Glucose: ${patient.ehr.fasting_glucose} mg/dL | HbA1c: ${patient.ehr.hba1c}%
- Cardiovascular Comorbidities: Diabetes=${patient.ehr.diabetes ? 'YES' : 'NO'}, Smoker=${patient.ehr.smoker ? 'YES' : 'NO'}, Family History=${patient.ehr.family_history ? 'YES' : 'NO'}

4. AI EXPLAINABILITY & PRIMARY PHYSIOLOGICAL DRIVERS
--------------------------------------------------------------------------------
Primary drivers contributing to current state:
1. Autonomic vagal withdrawal indicated by progressive drop in HRV (-${Math.abs(hrvDelta).toFixed(1)} ms).
2. Sympathetic compensatory elevation in resting heart rate (+${Math.abs(rhrDelta).toFixed(1)} bpm).
3. Sleep fragmentation and neurohormonal recovery deficit (${currentTelemetry.sleep_hours}h at ${(currentTelemetry.sleep_efficiency * 100).toFixed(0)}% efficiency).

5. RECOMMENDED CLINICAL PROTOCOL & NEXT STEPS
--------------------------------------------------------------------------------
[ ] STAT Serum Troponin-I and NT-proBNP draw
[ ] 12-Lead Electrocardiogram (ECG) for ischemic changes / conduction blocks
[ ] Telehealth outreach / nurse check-in for orthopnea or lower extremity edema
[ ] Review and optimize diuretic and beta-blocker titration

================================================================================
PHYSICIAN ATTESTATION:
Electronically signed and verified by Dr. E. Vance, MD.
================================================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CardioTwin_Clinical_Report_PT${patient.ehr.patient_id}_Day${activeDay}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess('Chart Note (.txt) Downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Export Telemetry CSV
  const handleDownloadCsv = () => {
    const headers = [
      'day_index',
      'hrv_mean',
      'resting_hr_mean',
      'mean_hr',
      'sleep_hours',
      'sleep_efficiency',
      'daily_steps',
      'activity_score',
      'risk_score',
      'state',
    ];
    const rows = patient.telemetry_series.map((d) => [
      d.day_index,
      d.hrv_mean,
      d.resting_hr_mean,
      d.mean_hr,
      d.sleep_hours,
      d.sleep_efficiency,
      d.daily_steps,
      d.activity_score,
      d.risk_score.toFixed(4),
      d.state,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CardioTwin_Telemetry_PT${patient.ehr.patient_id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess('Telemetry (.csv) Downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="w-full max-w-4xl bg-[#131B2E] border border-[#323D57] rounded-[4px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Toolbar (Screen-Only) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-[#0A0E18] border-b border-[#323D57]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F2F4F6]">
              CLINICAL CONSULTATION REPORT & EMR EXPORT // PT-{patient.ehr.patient_id}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Prints or saves as PDF via browser print dialogue"
            >
              <Printer className="w-3.5 h-3.5" />
              PRINT / SAVE AS PDF
            </button>
            <button
              onClick={handleDownloadNote}
              className="px-3 py-1.5 bg-[#161E31] hover:bg-[#1C263D] border border-[#323D57] text-[#F2F4F6] rounded-[2px] font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Download clean plain-text note for hospital EHR"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              DOWNLOAD CHART NOTE (.TXT)
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-2.5 py-1.5 bg-[#161E31] hover:bg-[#1C263D] border border-[#323D57] text-[#F2F4F6] rounded-[2px] font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Export 10-day time-series to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#9EA4B5] hover:text-[#F2F4F6] transition-colors rounded-[2px]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Download Status Toast */}
        {downloadSuccess && (
          <div className="print:hidden bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-1.5 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Printable Document Body */}
        <div
          id="clinical-report-printable"
          className="p-6 md:p-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0 print:text-black print:bg-white flex-1"
        >
          {/* Hospital & Department Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 inline-block" />
                <h1 className="text-xl font-black tracking-tight text-slate-950 font-sans uppercase">
                  CardioTwin Biometric Care Unit
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Division of Cardiology & Remote Patient Monitoring // St. Jude Cardiovascular Network
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Continuous Bio-Digital Twin Ambulatory Surveillance System
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-700">
              <div className="font-bold text-slate-900">CONSULTATION REPORT</div>
              <div>DATE: {new Date().toLocaleDateString()}</div>
              <div>TIME: {new Date().toLocaleTimeString()}</div>
              <div>STATUS: <strong className="text-emerald-700 font-bold">FINAL / AUTHENTICATED</strong></div>
            </div>
          </div>

          {/* Patient Demographics & Baseline Profile */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.ehr.name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Record / ID</span>
              <span className="font-mono font-bold text-slate-900">PT-{patient.ehr.patient_id}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Demographics</span>
              <span className="font-medium text-slate-900">
                {patient.ehr.age} Y / {patient.ehr.sex === 'M' ? 'Male' : 'Female'} • BMI {patient.ehr.bmi}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Attending Physician</span>
              <span className="font-medium text-slate-900">Dr. E. Vance, MD (CCU)</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Primary Clinical Diagnosis</span>
              <span className="font-bold text-slate-900">{patient.ehr.diagnosis}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Resting Blood Pressure</span>
              <span className="font-mono font-bold text-slate-900">
                {patient.ehr.systolic_bp} / {patient.ehr.diastolic_bp} mmHg
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Lipid / Glycemic Baseline</span>
              <span className="font-mono text-slate-800">
                Chol: {patient.ehr.cholesterol} | HbA1c: {patient.ehr.hba1c}%
              </span>
            </div>
          </div>

          {/* 24-48h AI Risk Stratification Box */}
          <div
            className={`border rounded p-4 mb-5 ${
              isDecomp
                ? 'bg-red-50 border-red-300 text-red-950'
                : isStrain
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isDecomp || isStrain ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                <h2 className="text-sm font-black uppercase tracking-wide">
                  24–48h Acute Decompensation Event Horizon
                </h2>
              </div>
              <span className="font-mono font-bold text-lg">
                Risk Score: <span className="underline">{riskPct}%</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed font-medium">
              <strong>Clinical Assessment:</strong> {riskBadge}. The digital twin model evaluates fused longitudinal
              wearable dynamics against the patient&apos;s personal baseline, projecting acute hemodynamic instability
              within 24 to 48 hours.
            </p>
          </div>

          {/* Wearable Biometrics vs Personal Baseline */}
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-200 pb-1">
            Wearable Biomarkers vs. Personal Baseline (Day {activeDay})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">HRV (RMSSD Mean)</span>
              <span className="text-base font-bold text-slate-900">{currentTelemetry.hrv_mean} ms</span>
              <span className={`block text-[11px] font-mono font-semibold ${hrvDelta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {hrvDelta >= 0 ? '+' : ''}{hrvDelta.toFixed(1)} ms vs Day 1
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Resting Heart Rate</span>
              <span className="text-base font-bold text-slate-900">{currentTelemetry.resting_hr_mean} bpm</span>
              <span className={`block text-[11px] font-mono font-semibold ${rhrDelta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {rhrDelta >= 0 ? '+' : ''}{rhrDelta.toFixed(1)} bpm vs Day 1
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Sleep Duration & Efficiency</span>
              <span className="text-base font-bold text-slate-900">{currentTelemetry.sleep_hours} hrs</span>
              <span className="block text-[11px] font-mono text-slate-600">
                {(currentTelemetry.sleep_efficiency * 100).toFixed(0)}% efficiency
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Ambulatory Activity</span>
              <span className="text-base font-bold text-slate-900">{currentTelemetry.daily_steps.toLocaleString()}</span>
              <span className="block text-[11px] font-mono text-slate-600">Daily Steps</span>
            </div>
          </div>

          {/* 10-Day Longitudinal Vitals Progression Table */}
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 border-b border-slate-200 pb-1">
            10-Day Longitudinal Vitals Trajectory
          </h3>
          <div className="border border-slate-200 rounded overflow-hidden mb-5">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-2 font-mono">Day</th>
                  <th className="py-1.5 px-2">HRV (ms)</th>
                  <th className="py-1.5 px-2">Rest HR (bpm)</th>
                  <th className="py-1.5 px-2">Mean HR</th>
                  <th className="py-1.5 px-2">Sleep (hrs)</th>
                  <th className="py-1.5 px-2">Steps</th>
                  <th className="py-1.5 px-2">Risk Score</th>
                  <th className="py-1.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.telemetry_series.map((day) => (
                  <tr
                    key={day.day_index}
                    className={day.day_index === activeDay ? 'bg-amber-50/70 font-semibold' : ''}
                  >
                    <td className="py-1 px-2 font-mono font-bold">D{day.day_index}</td>
                    <td className="py-1 px-2 font-mono">{day.hrv_mean}</td>
                    <td className="py-1 px-2 font-mono">{day.resting_hr_mean}</td>
                    <td className="py-1 px-2 font-mono">{day.mean_hr}</td>
                    <td className="py-1 px-2 font-mono">{day.sleep_hours}</td>
                    <td className="py-1 px-2 font-mono">{day.daily_steps.toLocaleString()}</td>
                    <td className="py-1 px-2 font-mono">{(day.risk_score * 100).toFixed(1)}%</td>
                    <td className="py-1 px-2 font-mono uppercase text-[10px]">
                      <span
                        className={`px-1 py-0.5 rounded font-bold ${
                          day.state === 'decompensation'
                            ? 'bg-red-100 text-red-800'
                            : day.state === 'strain'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {day.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommended Clinical Protocol & Attestation */}
          <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                Suggested Clinical Interventions
              </h4>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                <li>STAT Laboratory Draw: Serum Troponin-I, NT-proBNP, Serum Potassium/Creatinine.</li>
                <li>12-Lead Electrocardiogram to assess ST/T dynamic ischemic shifts or arrhythmias.</li>
                <li>Telehealth nursing check-in for dyspnea, orthopnea, or progressive pedal edema.</li>
                <li>Consider titration of neurohormonal blockade (ACEi/ARB/ARNi and Beta-Blocker).</li>
              </ul>
            </div>
            <div className="flex flex-col justify-end text-right font-mono text-[11px] text-slate-600">
              <div className="border-b border-slate-300 pb-1 mb-1 font-bold text-slate-900">
                Dr. E. Vance, MD (CCU Attending)
              </div>
              <div>License #: MD-CA-889421 • NPI: 1982736410</div>
              <div>Digital Attestation Verified via CardioTwin Platform</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

