import os
from pathlib import Path

import numpy as np
import pandas as pd


OUTPUT_DIR = Path(__file__).resolve().parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


np.random.seed(42)


def generate_ehr_profile(patient_id: int) -> dict:
    age = int(np.random.normal(58, 13))
    age = max(28, min(age, 88))

    bmi = round(np.random.normal(27.5, 4.2), 2)
    bmi = max(18.0, min(bmi, 42.0))

    systolic = int(np.random.normal(132, 16))
    systolic = max(95, min(systolic, 175))

    diastolic = int(np.random.normal(82, 10))
    diastolic = max(60, min(diastolic, 110))

    cholesterol = round(np.random.normal(186, 38), 1)
    cholesterol = max(120, min(cholesterol, 280))

    family_history = int(np.random.random() < 0.38)
    smoker = int(np.random.random() < 0.24)
    diabetes = int(np.random.random() < 0.22)
    sex = np.random.choice(["M", "F"])

    return {
        "patient_id": patient_id,
        "age": age,
        "sex": sex,
        "bmi": bmi,
        "systolic_bp": systolic,
        "diastolic_bp": diastolic,
        "cholesterol": cholesterol,
        "family_history": family_history,
        "smoker": smoker,
        "diabetes": diabetes,
    }


def make_wearable_series(patient, risk_day: int, risk_severity: float = 1.0) -> pd.DataFrame:
    rows = []
    for day in range(1, 11):
        if day < risk_day:
            risk_progress = min(1.0, (day - 1) / max(1, risk_day - 2))
        else:
            risk_progress = max(0.0, 1.0 - 0.5 * (day - risk_day + 1))
        risk_progress *= risk_severity

        hrv_base = 52 - max(0, patient["age"] - 40) * 0.12 - patient["diabetes"] * 2 - patient["smoker"] * 2
        hrv = hrv_base - 34 * risk_progress + np.random.normal(0, 4)
        hrv = max(18, min(hrv, 90))

        resting_hr_base = 60 + (patient["age"] * 0.04) + (patient["bmi"] * 0.2) + (patient["diabetes"] * 2)
        resting_hr = resting_hr_base + 22 * risk_progress + np.random.normal(0, 3)
        resting_hr = max(55, min(resting_hr, 95))

        mean_hr = resting_hr + 9 + np.random.normal(0, 3)
        mean_hr = max(55, min(mean_hr, 110))

        sleep_hours = 7.2 - 3.4 * risk_progress + np.random.normal(0, 0.5)
        sleep_hours = max(3.0, min(sleep_hours, 9.0))

        sleep_efficiency = 0.88 - 0.32 * risk_progress + np.random.normal(0, 0.04)
        sleep_efficiency = max(0.45, min(sleep_efficiency, 0.97))

        steps = max(1500, 8200 - 6500 * risk_progress + np.random.normal(0, 1200))
        steps = max(900, min(steps, 15000))

        activity_score = np.clip((steps / 1000) * 0.5 + (sleep_efficiency * 100) * 0.2, 0, 100)

        if day == risk_day - 1:
            risk_event_next_24h = 1
        else:
            risk_event_next_24h = 0

        rows.append(
            {
                "patient_id": patient["patient_id"],
                "day_index": day,
                "hrv_mean": round(float(hrv), 2),
                "resting_hr_mean": round(float(resting_hr), 2),
                "mean_hr": round(float(mean_hr), 2),
                "sleep_hours": round(float(sleep_hours), 2),
                "sleep_efficiency": round(float(sleep_efficiency), 3),
                "daily_steps": round(float(steps), 2),
                "activity_score": round(float(activity_score), 2),
                "risk_event_next_24h": int(risk_event_next_24h),
            }
        )

    return pd.DataFrame(rows)


def build_dataset(num_patients: int = 500) -> tuple[pd.DataFrame, pd.DataFrame]:
    ehr_rows = []
    wearable_rows = []

    for patient_id in range(1, num_patients + 1):
        patient = generate_ehr_profile(patient_id)
        ehr_rows.append(patient)

        # Create one impending risk event per patient, generally in the final 3–7 days.
        risk_day = int(np.random.uniform(5, 10))
        risk_severity = float(np.random.uniform(0.25, 1.15))
        patient_series = make_wearable_series(patient, risk_day, risk_severity)
        wearable_rows.append(patient_series)

    ehr_df = pd.DataFrame(ehr_rows)
    wearable_df = pd.concat(wearable_rows, ignore_index=True)

    combined = wearable_df.merge(ehr_df, on="patient_id", how="left")
    combined["risk_score_proxy"] = (
        (combined["resting_hr_mean"] - 70) * 0.7
        + (60 - combined["hrv_mean"]) * 0.9
        + (7 - combined["sleep_hours"]) * 6
        + (0.85 - combined["sleep_efficiency"]) * 80
        + (6000 - combined["daily_steps"]) / 250
        + combined["bmi"] * 0.2
    )

    return ehr_df, combined


def main() -> None:
    ehr_df, combined = build_dataset(num_patients=500)

    ehr_path = OUTPUT_DIR / "ehr_profiles.csv"
    wearable_path = OUTPUT_DIR / "wearable_history.csv"
    combined_path = OUTPUT_DIR / "patient_day_dataset.csv"

    ehr_df.to_csv(ehr_path, index=False)
    combined[[
        "patient_id",
        "day_index",
        "hrv_mean",
        "resting_hr_mean",
        "mean_hr",
        "sleep_hours",
        "sleep_efficiency",
        "daily_steps",
        "activity_score",
        "risk_event_next_24h",
    ]].to_csv(wearable_path, index=False)
    combined.to_csv(combined_path, index=False)

    print(f"Saved synthetic EHR profiles to {ehr_path}")
    print(f"Saved wearable history to {wearable_path}")
    print(f"Saved merged patient-day dataset to {combined_path}")
    print(f"Rows generated: {len(combined)}")
    print(f"Positive labels: {combined['risk_event_next_24h'].sum()} ({combined['risk_event_next_24h'].mean():.2%})")


if __name__ == "__main__":
    main()
