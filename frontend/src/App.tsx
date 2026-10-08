import React, { useEffect, useState } from 'react';
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
import { ClinicalReportModal } from './components/modals/ClinicalReportModal';
import { INITIAL_COHORT } from './data/cohortData';
import { fetchPatients, savePatient } from './data/riskApi';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cardiotwin-theme') !== 'light');
  const [cohort, setCohort] = useState<PatientProfile[]>(INITIAL_COHORT);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortError, setCohortError] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(101);
  const [currentView, setCurrentView] = useState<'cohort' | 'detail'>('detail');
  const [activeDay, setActiveDay] = useState<number>(7);
  const [modelConnected, setModelConnected] = useState(false);

  // Modals state
  const [isDataIntakeOpen, setIsDataIntakeOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);


  // Active patient object
  const activePatient = cohort.find((p) => p.ehr.patient_id === selectedPatientId) || cohort[0] || INITIAL_COHORT[0];
  const currentStats = {
    total_monitored: cohort.length,
    critical_count: cohort.filter((patient) => patient.latest_telemetry.state === 'decompensation' || patient.latest_telemetry.risk_score >= 0.65).length,
    warning_count: cohort.filter((patient) => patient.latest_telemetry.state === 'strain' || (patient.latest_telemetry.risk_score >= 0.25 && patient.latest_telemetry.risk_score < 0.65)).length,
    stable_count: cohort.filter((patient) => patient.latest_telemetry.state === 'homeostasis' && patient.latest_telemetry.risk_score < 0.25).length,
    hypertension_count: cohort.filter((patient) => patient.ehr.diagnosis.toLowerCase().includes('hypertension')).length,
    cardiovascular_risk_count: cohort.filter((patient) => patient.ehr.diagnosis.toLowerCase().includes('cardiovascular')).length,
    diabetic_count: cohort.filter((patient) => patient.ehr.diabetes === 1).length,
    avg_risk: cohort.length ? cohort.reduce((sum, patient) => sum + patient.latest_telemetry.risk_score, 0) / cohort.length : 0,
    sync_uptime_pct: cohort.length ? Number((cohort.reduce((sum, patient) => sum + patient.hardware.ble_fidelity, 0) / cohort.length).toFixed(1)) : 0,
  };

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cardiotwin-theme', theme);
  }, [isDarkMode]);

  const handleRefreshCohort = async () => {
    try {
      const patients = await fetchPatients();
      if (patients && patients.length > 0) {
        setCohort(patients);
        setModelConnected(true);
      }
    } catch (err) {
      console.warn('Backend refresh unavailable; retaining active cohort.', err);
      setModelConnected(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadCohort = async () => {
      try {
        const patients = await fetchPatients();
        if (cancelled) return;
        if (patients && patients.length > 0) {
          setCohort(patients);
          setModelConnected(true);
        }
      } catch (error) {
        if (cancelled) return;
        console.warn('Backend API offline; running in standalone demo mode with bundled cohort.');
        setModelConnected(false);
      }
    };
    void loadCohort();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDayChange = (day: number) => {
    setActiveDay(day);
    // Keep active patient's current telemetry in cohort aligned with selected day
    setCohort((prev) =>
      prev.map((p) => {
        if (p.ehr.patient_id === selectedPatientId) {
          const matched = p.telemetry_series.find((d) => d.day_index === day);
          if (matched) {
            return {
              ...p,
              current_day: day,
              latest_telemetry: matched,
            };
          }
        }
        return p;
      })
    );
  };

  const handleViewChange = (view: 'cohort' | 'detail') => {
    setCurrentView(view);
    if (view === 'cohort') {
      void handleRefreshCohort();
    }
  };

  // Callback when a new record or patient is submitted through the multi-modal intake
  const handleRecordAdded = async (updatedProfile: PatientProfile) => {
    const savedProfile = await savePatient(updatedProfile);
    setCohort((prev) => {
      const exists = prev.some((p) => p.ehr.patient_id === savedProfile.ehr.patient_id);
      if (exists) {
        return prev.map((p) => (p.ehr.patient_id === savedProfile.ehr.patient_id ? savedProfile : p));
      } else {
        return [savedProfile, ...prev];
      }
    });
    setSelectedPatientId(savedProfile.ehr.patient_id);
    setActiveDay(savedProfile.current_day);
    setCurrentView('detail');
  };

  return (
    <div className="min-h-screen bg-[#0A0E18] text-[#F2F4F6] flex flex-col font-sans selection:bg-[#323D57]">
      {/* Master Clinical Station Header */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
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
            stats={currentStats}
            onSelectPatient={(pid) => {
              setSelectedPatientId(pid);
              const p = cohort.find((item) => item.ehr.patient_id === pid);
              if (p) setActiveDay(p.current_day);
              setCurrentView('detail');
            }}
            onOpenDataIntake={() => setIsDataIntakeOpen(true)}
            onRefresh={handleRefreshCohort}
          />
        ) : (
          /* View 2: Patient Bio-Digital Twin Deep Dive Console */
          <div className="flex flex-col">
            {/* Top Patient Banner & Longitudinal 10-Day Cascade Scrubber */}
            <PatientBanner
              patient={activePatient}
              activeDay={activeDay}
              onDayChange={handleDayChange}
              modelConnected={modelConnected}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />


            {/* 3-Column Diagnostic Workstation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Column 1: Dynamic Continuous Wearable Telemetry (Live Stream) */}
              <WearableTelemetryCol
                patient={activePatient}
                activeDay={activeDay}
                onSelectDay={setActiveDay}
                modelConnected={modelConnected}
              />

              {/* Column 2: Static EHR Baseline & Laboratory Profile */}
              <EhrProfileCol ehr={activePatient.ehr} />

              {/* Column 3: Twin Model Explainability & Clinical Decision Support */}
              <ExplainabilityCol
                patient={activePatient}
                modelConnected={modelConnected}
                onTriggerCall={() => setIsCallModalOpen(true)}
                onOrderStat={() => setIsOrderModalOpen(true)}
                onExportFhir={() => setIsFhirModalOpen(true)}
                onOpenReportModal={() => setIsReportModalOpen(true)}
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

      <ClinicalReportModal
        patient={activePatient}
        activeDay={activeDay}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

export default App;
