from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
EHR_PATH = BASE_DIR / "data" / "sample_patients" / "synthetic_ehr.csv"
WEARABLE_PATH = BASE_DIR / "data" / "sample_patients" / "wearable_series.csv"
OUTPUT_PATH = BASE_DIR / "data" / "sample_patients" / "fused_dataset.csv"


def build_feature_table() -> pd.DataFrame:
    ehr = pd.read_csv(EHR_PATH)
    wearable = pd.read_csv(WEARABLE_PATH)
    merged = wearable.merge(ehr, on="patient_id", how="left")
    merged["sex"] = merged["sex"].map({"M": 1, "F": 0})
    merged = merged.sort_values(["patient_id", "day_index"]).reset_index(drop=True)

    baseline_cols = ["hrv_mean", "sleep_hours", "sleep_efficiency", "daily_steps", "resting_hr_mean"]
    for col in baseline_cols:
        merged[f"{col}_baseline"] = merged.groupby("patient_id")[col].transform("first")
        merged[f"{col}_delta_from_baseline"] = merged[col] - merged[f"{col}_baseline"]

    merged["hrv_drop_from_baseline"] = merged["hrv_mean_baseline"] - merged["hrv_mean"]
    merged["sleep_drop_from_baseline"] = merged["sleep_hours_baseline"] - merged["sleep_hours"]
    merged["step_drop_from_baseline"] = merged["daily_steps_baseline"] - merged["daily_steps"]
    merged["resting_hr_rise_from_baseline"] = merged["resting_hr_mean"] - merged["resting_hr_mean_baseline"]

    return merged


def main() -> None:
    fused = build_feature_table()
    fused.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved fused dataset to {OUTPUT_PATH}")
    print(f"Rows: {len(fused)} | Positive labels: {fused['risk_event_next_24h'].sum()}")


if __name__ == "__main__":
    main()
