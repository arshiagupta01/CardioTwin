"""
CardioTwin - Ambulatory Wearable Live Telemetry IoT Streamer
============================================================
Simulates a medical-grade ECG/PPG biosensor patch streaming real-time
biometric packets over BLE gateway to the CardioTwin digital twin API.

Aligned with the Happiest Health CRP Digital Twin Challenge 2026 specifications:
- Continuous high-frequency physiological streaming (PPG/ECG, instantaneous HR, RMSSD HRV, SpO2, Skin Temp)
- Realistic Respiratory Sinus Arrhythmia (RSA, ~0.25 Hz vagal modulation)
- Autonomic divergence modeling under cardiovascular decompensation
"""

import argparse
import math
import sys
import time
from datetime import datetime, timezone
import requests


def generate_packet(patient_id: int, sequence: int, elapsed_sec: float, scenario: str = "auto") -> dict:
    t = elapsed_sec

    # Physiological baseline parameters
    if scenario == "decompensation" or (scenario == "auto" and patient_id % 5 == 0):
        # Acute cardiovascular decompensation: suppressed vagal tone (low RSA), sympathetic tachycardia
        base_hr = 98.0
        rsa_amplitude = 1.2
        resp_freq = 0.32  # Tachypnea (20 breaths/min)
        noise = math.sin(t * 7.3) * 2.5
        hrv = max(9.0, 18.0 - math.sin(t * 2.0) * 3.0)
        spo2 = 92 + (1 if math.sin(t * 0.4) > 0 else 0)
        skin_temp = 35.8 + math.sin(t * 0.05) * 0.1
    elif scenario == "strain" or (scenario == "auto" and patient_id % 3 == 0):
        # Autonomic strain: moderate tachycardia, deteriorating sleep/recovery
        base_hr = 82.0
        rsa_amplitude = 2.4
        resp_freq = 0.28
        noise = math.sin(t * 4.1) * 1.5
        hrv = max(18.0, 31.0 - math.sin(t * 1.5) * 4.0)
        spo2 = 96
        skin_temp = 36.3 + math.sin(t * 0.05) * 0.1
    else:
        # Homeostasis (e.g. Parijat Lokhande PT-102 or healthy baseline):
        # Rich vagal RSA swings, robust parasympathetic reserve
        base_hr = 64.0
        rsa_amplitude = 4.8
        resp_freq = 0.22  # Resting eupnea (13 breaths/min)
        noise = math.sin(t * 2.2) * 0.6
        hrv = 54.0 + math.cos(t * 1.2) * 6.0
        spo2 = 99
        skin_temp = 36.8 + math.sin(t * 0.05) * 0.1

    # Instantaneous Heart Rate with Respiratory Sinus Arrhythmia
    resp_phase = math.sin(2 * math.pi * resp_freq * t)
    instant_bpm = round(base_hr + resp_phase * rsa_amplitude + noise, 1)

    return {
        "patient_id": patient_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instant_bpm": instant_bpm,
        "instant_hrv": round(hrv, 1),
        "instant_spo2": spo2,
        "instant_skin_temp": round(skin_temp, 2),
        "respiratory_rate": round(resp_freq * 60, 1),
        "packet_sequence": sequence,
    }


def main():
    parser = argparse.ArgumentParser(description="CardioTwin Wearable Feed Simulator")
    parser.add_argument("--url", default="http://localhost:8000/api/telemetry/stream", help="API stream endpoint")
    parser.add_argument("--patient", type=int, default=101, help="Patient ID to stream (e.g. 101, 102)")
    parser.add_argument("--scenario", choices=["auto", "homeostasis", "strain", "decompensation"], default="auto")
    parser.add_argument("--rate", type=float, default=1.0, help="Packet dispatch interval in seconds")
    parser.add_argument("--count", type=int, default=0, help="Number of packets (0 for infinite)")
    args = parser.parse_args()

    print("==================================================================")
    print("  CARDIOTWIN - WEARABLE BIOMARKER STREAMER [BLE GATEWAY EMULATOR]")
    print(f"  Target: {args.url}")
    print(f"  Patient: PT-{args.patient} | Scenario: {args.scenario}")
    print(f"  Rate: {args.rate}s interval (128 Hz aggregated)")
    print("==================================================================")

    sequence = 1
    start_time = time.time()

    try:
        while True:
            elapsed = time.time() - start_time
            packet = generate_packet(args.patient, sequence, elapsed, args.scenario)

            try:
                resp = requests.post(args.url, json=packet, timeout=2.0)
                if resp.status_code == 200:
                    data = resp.json().get("telemetry", {})
                    print(
                        f"[{datetime.now().strftime('%H:%M:%S')}] PKT #{sequence:05d} -> "
                        f"PT-{packet['patient_id']} | "
                        f"HR: {packet['instant_bpm']:5.1f} bpm | "
                        f"HRV: {packet['instant_hrv']:4.1f} ms | "
                        f"SpO2: {packet['instant_spo2']}% | "
                        f"Risk: {data.get('risk_score', 'N/A')} [{data.get('state', '').upper()}]"
                    )
                else:
                    print(f"HTTP {resp.status_code}: {resp.text}")
            except requests.exceptions.RequestException as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] PKT #{sequence:05d} generated (API offline or unreachable: {e.__class__.__name__})")

            sequence += 1
            if args.count > 0 and sequence > args.count:
                break
            time.sleep(args.rate)

    except KeyboardInterrupt:
        print("\nStreaming paused by operator.")


if __name__ == "__main__":
    main()
