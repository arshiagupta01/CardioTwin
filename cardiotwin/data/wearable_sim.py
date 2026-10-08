from pathlib import Path

import numpy as np
import pandas as pd


EHR_PATH = Path(__file__).resolve().parent / "sample_patients" / "synthetic_ehr.csv"
OUTPUT_PATH = Path(__file__).resolve().parent / "sample_patients" / "wearable_series.csv"


def simulate_patient(patient: pd.Series, risk_day: int) -> pd.DataFrame:
    rows = []
    for day in range(1, 11):
        if day < risk_day:
            risk_progress = min(1.0, (day - 1) / max(1, risk_day - 2))
        else:
            risk_progress = max(0.0, 1.0 - 0.5 * (day - risk_day + 1))

        hrv_base = 54 - max(0, patient["age"] - 40) * 0.15 - patient["diabetes"] * 3 - patient["smoker"] * 3
        hrv = hrv_base - 32 * risk_progress + np.random.normal(0, 3.5)

        resting_hr_base = 62 + patient["bmi"] * 0.28 + patient["diabetes"] * 3
        resting_hr = resting_hr_base + 24 * risk_progress + np.random.normal(0, 2.5)

        sleep_hours = 7.4 - 3.2 * risk_progress + np.random.normal(0, 0.4)
        sleep_efficiency = 0.89 - 0.32 * risk_progress + np.random.normal(0, 0.03)
        steps = max(1200, 8400 - 5800 * risk_progress + np.random.normal(0, 1000))
        activity_score = max(0, min(100, (steps / 8500) * 60 + sleep_efficiency * 40))

        risk_window = day >= risk_day - 1 and day <= risk_day
        rows.append(
            {
                "patient_id": int(patient["patient_id"]),
                "day_index": day,
                "hrv_mean": round(float(max(16, min(hrv, 90))), 2),
                "resting_hr_mean": round(float(max(55, min(resting_hr, 105))), 2),
                "mean_hr": round(float(max(60, min(resting_hr + 8 + np.random.normal(0, 2.5), 118))), 2),
                "sleep_hours": round(float(max(2.5, min(sleep_hours, 9.5))), 2),
                "sleep_efficiency": round(float(max(0.40, min(sleep_efficiency, 0.98))), 3),
                "daily_steps": round(float(max(800, min(steps, 15000))), 2),
                "activity_score": round(float(activity_score), 2),
                "risk_event_next_24h": int(risk_window),
            }
        )

    return pd.DataFrame(rows)



def main() -> None:
    ehr_df = pd.read_csv(EHR_PATH)
    frames = []

    for _, row in ehr_df.iterrows():
        risk_day = int(np.random.uniform(5, 10))
        series = simulate_patient(row, risk_day)
        frames.append(series)

    combined = pd.concat(frames, ignore_index=True)
    combined.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved simulated wearable data to {OUTPUT_PATH}")
    print(f"Total rows: {len(combined)}")


if __name__ == "__main__":
    main()
