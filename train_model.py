import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit


BASE_DIR = Path(__file__).resolve().parent
FUSED_DATA_PATH = BASE_DIR / "cardiotwin" / "data" / "sample_patients" / "fused_dataset.csv"
FALLBACK_DATA_PATH = BASE_DIR / "data" / "patient_day_dataset.csv"
MODEL_DIR = BASE_DIR / "cardiotwin" / "model"
LEGACY_MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
LEGACY_MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLUMNS = [
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


def load_dataset() -> pd.DataFrame:
    if FUSED_DATA_PATH.exists():
        df = pd.read_csv(FUSED_DATA_PATH)
    elif FALLBACK_DATA_PATH.exists():
        df = pd.read_csv(FALLBACK_DATA_PATH)
    else:
        raise FileNotFoundError(f"Neither {FUSED_DATA_PATH} nor {FALLBACK_DATA_PATH} was found.")

    if "sex" in df.columns and pd.api.types.is_object_dtype(df["sex"]):
        df["sex"] = df["sex"].map({"M": 1, "F": 0})

    # Ensure baseline delta features exist
    if "hrv_drop_from_baseline" not in df.columns:
        df = df.sort_values(["patient_id", "day_index"]).reset_index(drop=True)
        for col in ["hrv_mean", "sleep_hours", "daily_steps", "resting_hr_mean"]:
            df[f"{col}_baseline"] = df.groupby("patient_id")[col].transform("first")
        df["hrv_drop_from_baseline"] = df["hrv_mean_baseline"] - df["hrv_mean"]
        df["sleep_drop_from_baseline"] = df["sleep_hours_baseline"] - df["sleep_hours"]
        df["step_drop_from_baseline"] = df["daily_steps_baseline"] - df["daily_steps"]
        df["resting_hr_rise_from_baseline"] = df["resting_hr_mean"] - df["resting_hr_mean_baseline"]

    return df


def main() -> None:
    df = load_dataset()
    X = df[FEATURE_COLUMNS]
    y = df["risk_event_next_24h"]

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, test_indices = next(splitter.split(X, y, groups=df["patient_id"]))
    X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
    y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]

    model = RandomForestClassifier(
        n_estimators=700,
        max_depth=9,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    threshold_metrics = {}
    for threshold in (0.25, 0.5, 0.65):
        t_preds = probs >= threshold
        threshold_metrics[str(threshold)] = {
            "precision": round(float(precision_score(y_test, t_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, t_preds, zero_division=0)), 4),
            "confusion_matrix": confusion_matrix(y_test, t_preds).tolist(),
        }

    auc = float(roc_auc_score(y_test, probs))
    average_precision = float(average_precision_score(y_test, probs))

    print(classification_report(y_test, preds, target_names=["No risk", "High risk"], digits=3, zero_division=0))
    print(f"Patient-disjoint ROC AUC: {auc:.4f}")
    print(f"Average precision (PR-AUC): {average_precision:.4f}")

    summary_data = {
        "features": FEATURE_COLUMNS,
        "roc_auc": round(auc, 4),
        "average_precision": round(average_precision, 4),
        "validation_split": "patient-disjoint",
        "validation_patients": int(df.iloc[test_indices]["patient_id"].nunique()),
        "threshold_metrics": threshold_metrics,
    }

    # Save to active model path used by API
    joblib.dump(model, MODEL_DIR / "cardiotwin_model.joblib")
    (MODEL_DIR / "model_summary.json").write_text(json.dumps(summary_data, indent=2))
    print(f"Saved active model to {MODEL_DIR / 'cardiotwin_model.joblib'}")

    # Also save to legacy/alternative models directory for backwards compatibility
    joblib.dump(model, LEGACY_MODEL_DIR / "cardiotwin_model.joblib")
    (LEGACY_MODEL_DIR / "cardiotwin_model_meta.json").write_text(json.dumps(summary_data, indent=2))
    print(f"Saved compatibility model to {LEGACY_MODEL_DIR / 'cardiotwin_model.joblib'}")



if __name__ == "__main__":
    main()
