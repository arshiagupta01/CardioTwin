import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Award, Sparkles, Activity, Sliders, Box, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface JudgeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToCohort: () => void;
  onJumpToDetail: () => void;
}

interface TourStep {
  title: string;
  category: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  description: string;
  highlights: string[];
  evaluationCriterion: string;
  actionText: string;
  action: 'detail' | 'cohort';
}

export const JudgeTourModal: React.FC<JudgeTourModalProps> = ({
  isOpen,
  onClose,
  onJumpToCohort,
  onJumpToDetail,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: '1. Continuous 128Hz Wearable Stream & Sweeping ECG',
      category: 'REAL-TIME PHYSIOLOGICAL INGESTION',
      icon: Activity,
      badge: '128 HZ BLE STREAM',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
      description: 'CardioTwin continuously ingests high-frequency wearable sensor telemetry simulating photoplethysmography (PPG), accelerometer, and single-lead ECG.',
      highlights: [
        'Respiratory Sinus Arrhythmia (RSA ~0.25 Hz coupling with breathing phases)',
        'Continuous rolling RMSSD HRV computation with millisecond precision',
        'Lead II 60 FPS sweeping CRT Oscilloscope with synchronized acoustic monitor beeps',
        'Live ICU Central Ward Bedside Grid tracking 24 monitored patients simultaneously',
      ],
      evaluationCriterion: 'Technical Execution: High-frequency biometric pipeline fusing raw sensor streams with zero latency.',
      actionText: 'View Live ICU Central Station',
      action: 'cohort',
    },
    {
      title: '2. 10-Day Longitudinal Autonomic Cascade Scrubber',
      category: 'DISEASE TRAJECTORY SIMULATION',
      icon: Sparkles,
      badge: 'LONGITUDINAL CASCADE',
      badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
      description: 'Observe the compounding physiological drift leading up to acute cardiovascular decompensation over a 10-day timeline.',
      highlights: [
        'Interactive timeline scrubber from healthy baseline (Day 1) to critical crisis (Day 10)',
        'Captures early autonomic prodrome: vagal tone withdrawal (HRV drops -14.3 ms) before overt symptoms',
        'Simulates compensatory resting tachycardia (+26.8 bpm rise)',
        'Interactive auto-play cascade showing transition from Homeostasis → Strain → Decompensation',
      ],
      evaluationCriterion: 'Physiological Modeling: Faithful multi-day simulation of autonomic collapse preceding hospital admission.',
      actionText: 'Inspect Patient Cascade Horizon',
      action: 'detail',
    },
    {
      title: '3. In Silico Counterfactual "What-If" Sandbox',
      category: 'PREDICTIVE INTERVENTION SIMULATION',
      icon: Sliders,
      badge: 'RANDOM FOREST AUC 0.952',
      badgeColor: 'bg-sky-950/60 text-sky-300 border-sky-500/40',
      description: 'Clinicians can simulate targeted therapies on the virtual twin before prescribing drugs to see the exact predicted reduction in 24–48h risk.',
      highlights: [
        'Real-time sliders for HRV restoration, resting HR blunting, systolic BP control, and sleep recovery',
        'Direct backend inference calculating instant risk score delta (e.g. 67.3% → 22.1%)',
        'Explainable Gini feature importance highlighting primary drivers of cardiac risk',
        'Instant sensitivity feedback preventing premature or unsafe drug titration',
      ],
      evaluationCriterion: 'Innovation & Utility: Moves beyond simple risk prediction to actionable treatment optimization in silico.',
      actionText: 'Open What-If Sandbox',
      action: 'detail',
    },
    {
      title: '4. Interactive 3D Biophysical Twin & Beating Heart',
      category: 'MULTI-MODAL TWIN VISUALIZATION',
      icon: Box,
      badge: '3D ANATOMICAL MODEL',
      badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
      description: 'Multi-modal visualization bringing the digital twin to life through both dynamic native vector rendering and high-fidelity 3D embeds.',
      highlights: [
        'Native beating heart dynamically synchronizing its systolic cycle to live instantaneous BPM',
        'Permanent 3D Beating Heart embed (by jalmer on Sketchfab) with 360° orbit rotation and zoom',
        'Shadow Twin Residual Drift Radar quantifying multi-axial divergence (Δ 2.84σ) from healthy baseline',
        'Floating telemetry HUD overlay displaying live rhythm and autonomic state',
      ],
      evaluationCriterion: 'Clinical UX & Engagement: World-class visual workstation bridging abstract numbers with anatomical reality.',
      actionText: 'View 3D Cardiac Twin',
      action: 'detail',
    },
    {
      title: '5. National Health Stack (ABDM) & GDMT Co-Pilot',
      category: 'CLINICAL DEPLOYABILITY & STANDARDS',
      icon: ShieldCheck,
      badge: 'ABDM & FHIR R4 READY',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
      description: 'Tailored specifically for the Indian healthcare ecosystem with Ayushman Bharat Digital Mission (ABDM) compliance and evidence-based pharmacotherapy.',
      highlights: [
        '14-digit national ABHA ID integration (91-4521-8920-xxxx) for federated health record exchange',
        'AI 4-Pillar GDMT Pharmacotherapy Co-Pilot (ARNI, Beta-Blocker, MRA, SGLT2i) with 1-click sandbox simulation',
        'HL7 FHIR Release 4 standard JSON bundle export with SNOMED-CT risk coding',
        'EMR-ready clinical progress note and printable PDF consultation report generation',
      ],
      evaluationCriterion: 'Real-World Healthcare Impact: Production-ready interoperability for Indian hospitals and global EHRs.',
      actionText: 'Inspect Clinical Protocols',
      action: 'detail',
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleAction = () => {
    if (step.action === 'cohort') onJumpToCohort();
    else onJumpToDetail();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#131B2E] border border-emerald-500/50 rounded-[4px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0A0E18] border-b border-[#323D57]">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#F2F4F6]">
              CARDIOTWIN // 60-SECOND JUDGE TOUR (HAPPIEST HEALTH 2026)
            </h3>
          </div>
          <button onClick={onClose} className="text-[#9EA4B5] hover:text-[#F2F4F6]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#0A0E18] px-4 py-2 border-b border-[#323D57]/60 flex items-center justify-between font-mono text-[10px]">
          <span className="text-emerald-400 font-bold">
            STEP {currentStep + 1} OF {steps.length}
          </span>
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-6 h-1 rounded-[1px] transition-all ${
                  idx === currentStep ? 'bg-emerald-400' : idx < currentStep ? 'bg-emerald-800' : 'bg-[#323D57]'
                }`}
              />
            ))}
          </div>
          <span className="text-[#9EA4B5] uppercase">{step.category}</span>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-3 font-sans">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[3px] bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <StepIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F2F4F6] font-mono leading-tight">
                  {step.title}
                </h4>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] font-bold border shrink-0 ${step.badgeColor}`}>
              {step.badge}
            </span>
          </div>

          <p className="text-xs text-[#9EA4B5] leading-relaxed">
            {step.description}
          </p>

          {/* Highlights List */}
          <div className="space-y-1.5 p-3 rounded-[3px] bg-[#0A0E18] border border-[#323D57]/60 font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-[#9EA4B5] mb-1">KEY TECHNICAL HIGHLIGHTS:</div>
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-[#F2F4F6] text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Evaluation Criterion Callout */}
          <div className="p-2.5 rounded-[3px] bg-sky-950/20 border border-sky-500/30 text-[11px] font-mono flex items-start gap-2 text-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-300 font-bold block mb-0.5">HACKATHON CRITERION ALIGNMENT:</strong>
              {step.evaluationCriterion}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-4 py-3 bg-[#0A0E18] border-t border-[#323D57] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="px-2.5 py-1.5 bg-[#161E31] border border-[#323D57] text-[#F2F4F6] rounded-[2px] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-[#1C263D]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] font-bold flex items-center gap-1 shadow-sm"
              >
                <span>NEXT STEP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] font-bold"
              >
                FINISH TOUR ✓
              </button>
            )}
          </div>

          {/* Deep link action button */}
          <button
            onClick={handleAction}
            className="px-3 py-1.5 bg-[#161E31] hover:bg-[#1C263D] border border-emerald-500/40 text-emerald-300 rounded-[2px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>{step.actionText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
