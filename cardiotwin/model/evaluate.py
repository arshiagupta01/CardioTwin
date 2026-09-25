from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split


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

    X = df[FEATURES]
    y = df["risk_event_next_24h"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = joblib.load(MODEL_PATH)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    print("Evaluation metrics")
    print(classification_report(y_test, preds, target_names=["No risk", "High risk"], digits=3, zero_division=0))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, preds))
    print(f"ROC AUC: {roc_auc_score(y_test, probs):.3f}")


if __name__ == "__main__":
    main()
