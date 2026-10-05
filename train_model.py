import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "patient_day_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)


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
]


def main() -> None:
    df = pd.read_csv(DATA_PATH)

    # Sex will be converted to a numeric 0/1 encoding.
    df["sex"] = df["sex"].map({"M": 1, "F": 0})
    y = df["risk_event_next_24h"]
    X = df[FEATURE_COLUMNS]

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_indices, test_indices = next(splitter.split(X, y, groups=df["patient_id"]))
    X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
    y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]

    model = RandomForestClassifier(
        n_estimators=350,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    report = classification_report(y_test, y_pred, target_names=["No risk", "High risk"], digits=3)
    auc = roc_auc_score(y_test, y_prob)
    print("Model training complete.")
    print(report)
    print(f"AUC: {auc:.3f}")

    joblib.dump(model, MODEL_DIR / "cardiotwin_model.joblib")

    meta = {
        "feature_columns": FEATURE_COLUMNS,
        "target": "risk_event_next_24h",
        "training_auc": round(float(auc), 4),
    }
    (MODEL_DIR / "cardiotwin_model_meta.json").write_text(json.dumps(meta, indent=2))

    print(f"Saved model to {MODEL_DIR / 'cardiotwin_model.joblib'}")
    print(f"Saved metadata to {MODEL_DIR / 'cardiotwin_model_meta.json'}")


if __name__ == "__main__":
    main()
