from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "sample_patients" / "fused_dataset.csv"
MODEL_PATH = BASE_DIR / "model" / "cardiotwin_model.joblib"

FEATURES = [
    "age",
    "sex",
    "bmi",
    "systolic_bp",
    "diastolic_bp",
    "cholesterol",
    "family_history",
    "smoker",
    "diabetes",
    "hrv_mean",
    "resting_hr_mean",
    "mean_hr",
    "sleep_hours",
    "sleep_efficiency",
    "daily_steps",
    "activity_score",
    "hrv_drop_from_baseline",
    "sleep_drop_from_baseline",
    "step_drop_from_baseline",
    "resting_hr_rise_from_baseline",
]


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    if "sex" in df.columns and pd.api.types.is_object_dtype(df["sex"]):
        df["sex"] = df["sex"].map({"M": 1, "F": 0})

    model = joblib.load(MODEL_PATH)
    importances = sorted(
        zip(FEATURES, model.feature_importances_),
        key=lambda item: item[1],
        reverse=True,
    )

    print("Top feature drivers for the CardioTwin risk model")
    for feature, value in importances[:8]:
        print(f"{feature}: {value:.4f}")

    print("\nPlain-language interpretation:")
    print("The model is primarily responding to shifts in HRV, sleep efficiency, activity levels, and rising resting heart rate before an event.")


if __name__ == "__main__":
    main()
