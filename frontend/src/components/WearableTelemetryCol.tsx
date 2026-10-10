import React, { useState } from 'react';
import { PatientProfile } from '../types/clinical';
import { OscilloscopeMonitor } from './OscilloscopeMonitor';
import { DynamicBeatingHeart } from './DynamicBeatingHeart';
import { DynamicEmbedWidget } from './DynamicEmbedWidget';
import { WaveformCharts } from './WaveformCharts';
import { Smartphone, BatteryCharging, Radio, Thermometer, Box, Heart } from 'lucide-react';
import { ClinicalTooltip } from './ClinicalTooltip';

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

  const currentTelemetry =
    patient.telemetry_series.find((d) => d.day_index === activeDay) || patient.latest_telemetry;

  const calculatedBpm = Math.round(currentTelemetry.resting_hr_mean + 12);

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
        <span className={`text-[10px] font-mono flex items-center gap-1 ${modelConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${modelConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          {modelConnected ? 'MODEL SCORED' : 'BUNDLED DEMO DATA'}
        </span>
      </div>

      {/* 1. Real-time Sweeping ECG Oscilloscope Monitor */}
      <OscilloscopeMonitor
        bpm={calculatedBpm}
        hrv={currentTelemetry.hrv_mean}
        state={currentTelemetry.state}
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
          bpm={calculatedBpm}
          hrv={currentTelemetry.hrv_mean}
          state={currentTelemetry.state}
        />
      ) : (
        <DynamicEmbedWidget
          bpm={calculatedBpm}
          hrv={currentTelemetry.hrv_mean}
          state={currentTelemetry.state}
        />
      )}

      {/* 3. Longitudinal 10-Day Waveform Charts (HRV, RHR, Sleep Architecture, Steps) */}
      <WaveformCharts
        telemetrySeries={patient.telemetry_series}
        activeDay={activeDay}
        onSelectDay={onSelectDay}
        state={currentTelemetry.state}
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
          <span className="text-emerald-400 font-mono text-[9px]">CSV SNAPSHOT</span>
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
              {patient.hardware.battery_level == null ? 'N/A' : `${patient.hardware.battery_level}%`}
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
              {patient.hardware.skin_temp_c == null ? 'N/A' : `${patient.hardware.skin_temp_c}°C`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
