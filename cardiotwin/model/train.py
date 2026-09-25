import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split


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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

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

    print(classification_report(y_test, preds, target_names=["No risk", "High risk"], digits=3))
    print(f"ROC AUC: {roc_auc_score(y_test, probs):.3f}")

    joblib.dump(model, MODEL_DIR / "cardiotwin_model.joblib")
    (MODEL_DIR / "model_summary.json").write_text(
        json.dumps({
            "features": FEATURES,
            "roc_auc": round(float(roc_auc_score(y_test, probs)), 4),
        }, indent=2)
    )

    print(f"Saved model to {MODEL_DIR / 'cardiotwin_model.joblib'}")


if __name__ == "__main__":
    main()
