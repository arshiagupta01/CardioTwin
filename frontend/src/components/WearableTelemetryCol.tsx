import React, { useState } from 'react';
import { PatientProfile } from '../types/clinical';
import { OscilloscopeMonitor } from './OscilloscopeMonitor';
import { DynamicBeatingHeart } from './DynamicBeatingHeart';
import { DynamicEmbedWidget } from './DynamicEmbedWidget';
import { WaveformCharts } from './WaveformCharts';
import { Smartphone, BatteryCharging, Radio, Thermometer, Box, Heart, Activity, HeartPulse, Zap } from 'lucide-react';
import { ClinicalTooltip } from './ClinicalTooltip';
import { useLiveTelemetry } from '../context/LiveTelemetryContext';

interface WearableTelemetryColProps {
  patient: PatientProfile;
  activeDay: number;
  onSelectDay: (day: number) => void;
  modelConnected: boolean;
}

export const WearableTelemetryCol: React.FC<WearableTelemetryColProps> = ({
  patient,
  activeDay,
  onSelectDay,
  modelConnected,
}) => {
  const [visualMode, setVisualMode] = useState<'native' | 'embed'>('native');
  const { isLiveMode, getPatientLiveTelemetry } = useLiveTelemetry();

  const currentTelemetry =
    patient.telemetry_series.find((d) => d.day_index === activeDay) || patient.latest_telemetry;

  // Real-time continuous physiological synthesis for active patient
  const live = getPatientLiveTelemetry(patient.ehr.patient_id, currentTelemetry, patient.ehr);

  const activeBpm = isLiveMode ? live.instant_bpm : Math.round(currentTelemetry.resting_hr_mean + 12);
  const activeHrv = isLiveMode ? live.instant_hrv : currentTelemetry.hrv_mean;
  const activeState = isLiveMode ? live.instant_state : currentTelemetry.state;

  return (
    <div className="flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#323D57] pb-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <ClinicalTooltip
            term="CONTINUOUS WEARABLE TELEMETRY"
            definition="High-frequency physiologic data collected by medical-grade on-body sensors including PPG, ECG, and accelerometer."
            clinicalSignificance="Provides uninterrupted ambulatory monitoring to catch autonomic decompensation before overt symptoms occur."
          >
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#F2F4F6]">
              PATIENT WEARABLE TELEMETRY
            </h3>
          </ClinicalTooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            128 HZ LIVE
          </span>
          <span className={`text-[10px] font-mono flex items-center gap-1 ${modelConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {modelConnected ? 'MODEL SCORED' : 'BUNDLED DATA'}
          </span>
        </div>
      </div>

      {/* 1. Real-time Sweeping ECG Oscilloscope Monitor */}
      <OscilloscopeMonitor
        bpm={activeBpm}
        hrv={activeHrv}
        state={activeState}
        height={135}
      />

      {/* Visual Mode Selector: Native Synced Heart vs 3D / Lottie Embed */}
      <div className="flex items-center justify-between px-1 font-mono text-[10px]">
        <ClinicalTooltip
          term="CARDIAC VISUALIZATION"
          definition="Dynamic twin representation displaying real-time contractility and rhythmic rate changes."
          clinicalSignificance="Enables rapid qualitative assessment of cardiac workload and tachycardia."
        >
          <span className="text-[#9EA4B5] uppercase">CARDIAC VISUALIZATION MODE:</span>
        </ClinicalTooltip>
        <div className="flex items-center gap-1 bg-[#0A0E18] p-0.5 rounded-[2px] border border-[#323D57]">
          <button
            onClick={() => setVisualMode('native')}
            className={`px-2 py-0.5 rounded-[2px] flex items-center gap-1 transition-colors ${
              visualMode === 'native'
                ? 'bg-[#161E31] text-emerald-400 font-bold border border-emerald-500/40'
                : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
            }`}
          >
            <Heart className="w-2.5 h-2.5" />
            <span>NATIVE SYNCED MODEL</span>
          </button>

          <button
            onClick={() => setVisualMode('embed')}
            className={`px-2 py-0.5 rounded-[2px] flex items-center gap-1 transition-colors ${
              visualMode === 'embed'
                ? 'bg-[#161E31] text-sky-400 font-bold border border-sky-500/40'
                : 'text-[#9EA4B5] hover:text-[#F2F4F6]'
            }`}
          >
            <Box className="w-2.5 h-2.5" />
            <span>3D EMBED / LOTTIE</span>
          </button>
        </div>
      </div>

      {/* 2. Cardiac Dynamic Model (Native or 3D Embed) */}
      {visualMode === 'native' ? (
        <DynamicBeatingHeart
          bpm={activeBpm}
          hrv={activeHrv}
          state={activeState}
        />
      ) : (
        <DynamicEmbedWidget
          bpm={activeBpm}
          hrv={activeHrv}
          state={activeState}
        />
      )}

      {/* Real-time Dynamic Telemetry Ingestion Metrics (Hackathon Challenge Standard) */}
      <div className="rounded-[4px] border border-emerald-500/30 bg-emerald-950/10 p-2.5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300 mb-2 flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>REAL-TIME PHYSIOLOGIC INGESTION STREAM</span>
          </div>
          <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/60 px-1 py-0.2 rounded-[2px] border border-emerald-500/40">
            {live.last_packet_age_ms}ms LATENCY
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
          {/* Instantaneous HR */}
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/60">
            <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
              <HeartPulse className="w-3 h-3 text-red-400" />
              INSTANT HR
            </div>
            <div className="font-bold text-[#F2F4F6] mt-0.5 text-sm">
              {activeBpm} <span className="text-[9px] text-[#9EA4B5] font-normal">BPM</span>
            </div>
            <div className="text-[8px] text-sky-400 uppercase mt-0.5">
              RSA: {live.breathing_phase}
            </div>
          </div>

          {/* Live RMSSD */}
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/60">
            <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              ROLLING HRV
            </div>
            <div className="font-bold text-[#F2F4F6] mt-0.5 text-sm">
              {activeHrv} <span className="text-[9px] text-[#9EA4B5] font-normal">ms</span>
            </div>
            <div className="text-[8px] text-[#9EA4B5] uppercase mt-0.5">
              RMSSD INDEX
            </div>
          </div>

          {/* Pulse Oximetry */}
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/60">
            <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-sky-400" />
              PULSE SpO2
            </div>
            <div className="font-bold text-[#F2F4F6] mt-0.5 text-sm">
              {live.instant_spo2}%
            </div>
            <div className="text-[8px] text-emerald-400 uppercase mt-0.5">
              {live.instant_spo2 >= 95 ? 'OPTIMAL' : 'MONITORING'}
            </div>
          </div>

          {/* Respiration */}
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/60">
            <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
              <Radio className="w-3 h-3 text-amber-400" />
              RESP RATE
            </div>
            <div className="font-bold text-[#F2F4F6] mt-0.5 text-sm">
              {live.respiratory_rate} <span className="text-[9px] text-[#9EA4B5] font-normal">br/m</span>
            </div>
            <div className="text-[8px] text-sky-300 uppercase mt-0.5">
              AUTONOMIC RHYTHM
            </div>
          </div>
        </div>
      </div>

      {/* 3. Longitudinal 10-Day Waveform Charts (HRV, RHR, Sleep Architecture, Steps) */}
      <WaveformCharts
        telemetrySeries={patient.telemetry_series}
        activeDay={activeDay}
        onSelectDay={onSelectDay}
        state={activeState}
      />

      {/* 4. Wearable Device Hardware Diagnostics */}
      <div className="rounded-[4px] border border-[#323D57] bg-[#131B2E] p-2.5">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9EA4B5] mb-2 flex items-center justify-between">
          <ClinicalTooltip
            term="SENSOR HARDWARE INTEGRITY"
            definition="Hardware telemetry verifying that wearable sensors maintain continuous skin contact and strong radio transmission."
            clinicalSignificance="Ensures alerts stem from true physiological changes rather than sensor dislodgement or dead batteries."
          >
            <span>WEARABLE SENSOR HARDWARE STATUS</span>
          </ClinicalTooltip>
          <span className="text-emerald-400 font-mono text-[9px]">
            PKT #{live.packet_count.toLocaleString()} • {live.link_quality.toFixed(1)}% LINK
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="BATTERY RESERVE"
              definition="Remaining battery percentage of the on-body biometric patch."
              normalRange="> 20%"
              clinicalSignificance="Prevents telemetry blind spots from unexpected device shutdown."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
                BATTERY
              </div>
            </ClinicalTooltip>
            <div className="font-bold text-[#F2F4F6] mt-0.5">
              {patient.hardware.battery_level}%
            </div>
          </div>

          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="BLE SIGNAL (RSSI)"
              definition="Bluetooth Low Energy Received Signal Strength Indicator measured in decibels (dBm)."
              normalRange="-30 to -70 dBm"
              clinicalSignificance="Confirms robust wireless telemetry to the hospital gateway without packet loss."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
                <Radio className="w-3 h-3 text-sky-400" />
                BLE RSSI
              </div>
            </ClinicalTooltip>
            <div className="font-bold text-[#F2F4F6] mt-0.5">
              {patient.hardware.ble_rssi}
            </div>
          </div>

          <div className="bg-[#161E31] p-1.5 rounded-[2px] border border-[#323D57]/50">
            <ClinicalTooltip
              term="PERIPHERAL SKIN TEMPERATURE"
              definition="Cutaneous skin surface temperature measured directly at the biosensor interface."
              normalRange="33.0 - 36.5 °C"
              clinicalSignificance="Peripheral vasoconstriction during autonomic crisis or shock causes rapid drops in skin temperature."
              hideIcon={true}
            >
              <div className="text-[9px] uppercase text-[#9EA4B5] flex items-center justify-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-400" />
                SKIN TEMP
              </div>
            </ClinicalTooltip>
            <div className="font-bold text-[#F2F4F6] mt-0.5">
              {live.instant_skin_temp}°C
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
