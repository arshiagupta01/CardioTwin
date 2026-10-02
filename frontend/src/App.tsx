import React, { useEffect, useState } from 'react';
import { INITIAL_COHORT, COHORT_STATS, SHAP_EXPLANATION_RAVI } from './data/cohortData';
import { PatientProfile } from './types/clinical';
import { Header } from './components/Header';
import { PatientBanner } from './components/PatientBanner';
import { WearableTelemetryCol } from './components/WearableTelemetryCol';
import { EhrProfileCol } from './components/EhrProfileCol';
import { ExplainabilityCol } from './components/ExplainabilityCol';
import { CohortView } from './components/CohortView';
import { RecordIntakeModal } from './components/RecordIntakeModal';
import { CallModal } from './components/modals/CallModal';
import { OrderModal } from './components/modals/OrderModal';
import { FhirModal } from './components/modals/FhirModal';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cardiotwin-theme') !== 'light');
  const [cohort, setCohort] = useState<PatientProfile[]>(INITIAL_COHORT);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(101);
  const [currentView, setCurrentView] = useState<'cohort' | 'detail'>('detail');
  const [activeDay, setActiveDay] = useState<number>(7);

  // Modals state
  const [isDataIntakeOpen, setIsDataIntakeOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);

  // Active patient object
  const activePatient = cohort.find((p) => p.ehr.patient_id === selectedPatientId) || cohort[0];

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cardiotwin-theme', theme);
  }, [isDarkMode]);

  // Callback when a new record or patient is submitted through the multi-modal intake
  const handleRecordAdded = (updatedProfile: PatientProfile) => {
    setCohort((prev) => {
      const exists = prev.some((p) => p.ehr.patient_id === updatedProfile.ehr.patient_id);
      if (exists) {
        return prev.map((p) => (p.ehr.patient_id === updatedProfile.ehr.patient_id ? updatedProfile : p));
      } else {
        return [updatedProfile, ...prev];
      }
    });
    setSelectedPatientId(updatedProfile.ehr.patient_id);
    setActiveDay(updatedProfile.current_day);
    setCurrentView('detail');
  };

  return (
    <div className="min-h-screen bg-[#0A0E18] text-[#F2F4F6] flex flex-col font-sans selection:bg-[#323D57]">
      {/* Master Clinical Station Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenDataIntake={() => setIsDataIntakeOpen(true)}
        selectedPatientId={selectedPatientId}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((current) => !current)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 p-3 md:p-4 max-w-[1680px] w-full mx-auto">
        {currentView === 'cohort' ? (
          /* View 1: Doctor's Cohort Triage Dashboard */
          <CohortView
            cohort={cohort}
            stats={COHORT_STATS}
            onSelectPatient={(pid) => {
              setSelectedPatientId(pid);
              const p = cohort.find((item) => item.ehr.patient_id === pid);
              if (p) setActiveDay(p.current_day);
              setCurrentView('detail');
            }}
            onOpenDataIntake={() => setIsDataIntakeOpen(true)}
          />
        ) : (
          /* View 2: Patient Bio-Digital Twin Deep Dive Console */
          <div className="flex flex-col">
            {/* Top Patient Banner & Longitudinal 10-Day Cascade Scrubber */}
            <PatientBanner
              patient={activePatient}
              activeDay={activeDay}
              onDayChange={setActiveDay}
            />

            {/* 3-Column Diagnostic Workstation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Column 1: Dynamic Continuous Wearable Telemetry (Live Stream) */}
              <WearableTelemetryCol
                patient={activePatient}
                activeDay={activeDay}
                onSelectDay={setActiveDay}
              />

              {/* Column 2: Static EHR Baseline & Laboratory Profile */}
              <EhrProfileCol ehr={activePatient.ehr} />

              {/* Column 3: Twin Model Explainability & Clinical Decision Support */}
              <ExplainabilityCol
                patient={activePatient}
                shapDrivers={SHAP_EXPLANATION_RAVI}
                onTriggerCall={() => setIsCallModalOpen(true)}
                onOrderStat={() => setIsOrderModalOpen(true)}
                onExportFhir={() => setIsFhirModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <RecordIntakeModal
        cohort={cohort}
        isOpen={isDataIntakeOpen}
        onClose={() => setIsDataIntakeOpen(false)}
        onRecordAdded={handleRecordAdded}
      />

      <CallModal
        patient={activePatient}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />

      <OrderModal
        patient={activePatient}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />

      <FhirModal
        patient={activePatient}
        isOpen={isFhirModalOpen}
        onClose={() => setIsFhirModalOpen(false)}
      />
    </div>
  );
}

export default App;
