import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit


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
    print(f"Loading evaluation dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    if "sex" in df.columns and pd.api.types.is_object_dtype(df["sex"]):
        df["sex"] = df["sex"].map({"M": 1, "F": 0})

    X = df[FEATURES]
    y = df["risk_event_next_24h"]

    # Clinically rigorous patient-disjoint split (prevents intra-patient time leakage)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, test_indices = next(splitter.split(X, y, groups=df["patient_id"]))
    X_test, y_test = X.iloc[test_indices], y.iloc[test_indices]
    test_patients = df.iloc[test_indices]["patient_id"].nunique()

    model = joblib.load(MODEL_PATH)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    auc = float(roc_auc_score(y_test, probs))
    ap = float(average_precision_score(y_test, probs))

    print("\n" + "=" * 60)
    print("  CARDIOTWIN MODEL EVALUATION (Patient-Disjoint Validation)")
    print("=" * 60)
    print(f"Evaluated on {len(X_test)} records across {test_patients} unseen holdout patients.")
    print(f"Patient-disjoint ROC AUC:       {auc:.4f}")
    print(f"Average Precision (PR-AUC):     {ap:.4f}")

    print("\n--- Standard Binary Classification Report (Threshold = 0.50) ---")
    print(classification_report(y_test, preds, target_names=["No risk", "High risk"], digits=3, zero_division=0))
    print("Confusion Matrix (0.50):")
    print(confusion_matrix(y_test, preds))

    print("\n--- Clinical Tier Metrics Across Operating Thresholds ---")
    for threshold, label in [(0.25, "Strain / Early Warning"), (0.50, "Default Binary"), (0.65, "Decompensation / STAT")]:
        t_preds = probs >= threshold
        prec = precision_score(y_test, t_preds, zero_division=0)
        rec = recall_score(y_test, t_preds, zero_division=0)
        cm = confusion_matrix(y_test, t_preds)
        print(f"Threshold {threshold:.2f} [{label}]: Precision={prec:.3f}, Recall (Sensitivity)={rec:.3f}, TN={cm[0,0]}, FP={cm[0,1]}, FN={cm[1,0]}, TP={cm[1,1]}")
    print("=" * 60 + "\n")



if __name__ == "__main__":
    main()
