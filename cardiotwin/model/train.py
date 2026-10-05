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


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "sample_patients" / "fused_dataset.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(exist_ok=True)

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
    X = df[FEATURES]
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
        threshold_preds = probs >= threshold
        threshold_metrics[str(threshold)] = {
            "precision": round(float(precision_score(y_test, threshold_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, threshold_preds, zero_division=0)), 4),
            "confusion_matrix": confusion_matrix(y_test, threshold_preds).tolist(),
        }

    auc = float(roc_auc_score(y_test, probs))
    average_precision = float(average_precision_score(y_test, probs))

    print(classification_report(y_test, preds, target_names=["No risk", "High risk"], digits=3))
    print(f"Patient-disjoint ROC AUC: {auc:.3f}")
    print(f"Average precision: {average_precision:.3f}")
    print(f"Threshold metrics: {threshold_metrics}")

    joblib.dump(model, MODEL_DIR / "cardiotwin_model.joblib")
    (MODEL_DIR / "model_summary.json").write_text(
        json.dumps({
            "features": FEATURES,
            "roc_auc": round(auc, 4),
            "average_precision": round(average_precision, 4),
            "validation_split": "patient-disjoint",
            "validation_patients": int(df.iloc[test_indices]["patient_id"].nunique()),
            "threshold_metrics": threshold_metrics,
        }, indent=2)
    )

    print(f"Saved model to {MODEL_DIR / 'cardiotwin_model.joblib'}")


if __name__ == "__main__":
    main()
