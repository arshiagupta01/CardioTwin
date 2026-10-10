import json
import os
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CardioTwin API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "model" / "cardiotwin_model.joblib"
LIVE_DATA_PATH = Path(os.environ.get("CARDIOTWIN_LIVE_CSV_PATH", BASE_DIR / "data" / "live_patients.csv"))
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
LIVE_CSV_REQUIRED_COLUMNS = {
    "patient_id", "timestamp", "age", "sex", "bmi", "systolic_bp", "diastolic_bp",
    "cholesterol", "family_history", "smoker", "diabetes", "hrv_mean", "resting_hr_mean",
    "mean_hr", "sleep_hours", "sleep_efficiency", "daily_steps", "activity_score",
}
LIVE_CSV_OPTIONAL_NUMERIC_COLUMNS = {
    "ldl", "hdl", "fasting_glucose", "hba1c", "hrv_drop_from_baseline",
    "sleep_drop_from_baseline", "step_drop_from_baseline", "resting_hr_rise_from_baseline",
    "hrv_drop_frome_baseline",
}


class RiskInput(BaseModel):
    age: float
    sex: int
    bmi: float
    systolic_bp: float
    diastolic_bp: float
    cholesterol: float
    family_history: int
    smoker: int
    diabetes: int
    hrv_mean: float
    resting_hr_mean: float
    mean_hr: float
    sleep_hours: float
    sleep_efficiency: float
    daily_steps: float
    activity_score: float
    hrv_drop_from_baseline: float
    sleep_drop_from_baseline: float
    step_drop_from_baseline: float
    resting_hr_rise_from_baseline: float


class BatchRiskInput(BaseModel):
    records: list[RiskInput]


@lru_cache(maxsize=1)
def load_model():
    return joblib.load(MODEL_PATH)


def _read_profiles() -> list[dict]:
    if not LIVE_DATA_PATH.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"Live CSV feed not found. Set CARDIOTWIN_LIVE_CSV_PATH (current path: {LIVE_DATA_PATH}).",
        )
    if not MODEL_PATH.is_file():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")

    try:
        data = pd.read_csv(LIVE_DATA_PATH)
    except (OSError, pd.errors.EmptyDataError, pd.errors.ParserError, UnicodeDecodeError) as error:
        raise HTTPException(status_code=503, detail=f"Unable to read live CSV feed: {error}") from error

    missing_columns = sorted(LIVE_CSV_REQUIRED_COLUMNS - set(data.columns))
    if missing_columns:
        raise HTTPException(
            status_code=422,
            detail=f"Live CSV is missing required columns: {', '.join(missing_columns)}",
        )
    if data.empty:
        return []

    raw_patient_ids = data["patient_id"].astype(str)
    patient_id_digits = raw_patient_ids.str.extract(r"(\d+)$", expand=False)
    data["patient_id"] = pd.to_numeric(patient_id_digits, errors="coerce")
    if data["patient_id"].isna().any():
        raise HTTPException(status_code=422, detail="patient_id must be numeric or end with digits, such as PID_001")

    numeric_columns = LIVE_CSV_REQUIRED_COLUMNS - {"patient_id", "sex", "timestamp"}
    numeric_columns |= LIVE_CSV_OPTIONAL_NUMERIC_COLUMNS & set(data.columns)
    for column in numeric_columns:
        data[column] = pd.to_numeric(data[column], errors="coerce")
    if data[list(LIVE_CSV_REQUIRED_COLUMNS - {"patient_id", "sex", "timestamp"})].isna().any().any():
        raise HTTPException(status_code=422, detail="Live CSV contains missing or non-numeric required values")

    delta_aliases = {
        "hrv_drop_from_baseline": "hrv_drop_frome_baseline",
    }
    for canonical, alias in delta_aliases.items():
        if canonical not in data and alias in data:
            data[canonical] = data[alias]

    optional_defaults = {
        "name": pd.Series([f"Patient {int(patient_id)}" for patient_id in data["patient_id"]], index=data.index),
        "diagnosis": pd.Series(["Not provided"] * len(data), index=data.index),
        "medications": pd.Series([""] * len(data), index=data.index),
    }
    for column, default in optional_defaults.items():
        if column not in data:
            data[column] = default
        else:
            data[column] = data[column].fillna(default)

    data["timestamp"] = pd.to_datetime(data["timestamp"], utc=True, errors="coerce")
    data["sex"] = data["sex"].astype(str).str.upper()
    if data["timestamp"].isna().any() or not data["sex"].isin(["M", "F"]).all():
        raise HTTPException(status_code=422, detail="Live CSV has invalid timestamps or sex values (expected M/F)")
    data = data.sort_values(["patient_id", "timestamp"])
    model = load_model()
    profiles = []
    for patient_id, patient_data in data.groupby("patient_id", sort=True):
        patient_data = patient_data.reset_index(drop=True)
        baseline = patient_data.iloc[0]
        features = patient_data[
            ["age", "sex", "bmi", "systolic_bp", "diastolic_bp", "cholesterol", "family_history", "smoker", "diabetes",
             "hrv_mean", "resting_hr_mean", "mean_hr", "sleep_hours", "sleep_efficiency", "daily_steps", "activity_score"]
        ].copy()
        features["sex"] = features["sex"].map({"M": 1, "F": 0})
        delta_defaults = {
            "hrv_drop_from_baseline": baseline["hrv_mean"] - patient_data["hrv_mean"],
            "sleep_drop_from_baseline": baseline["sleep_hours"] - patient_data["sleep_hours"],
            "step_drop_from_baseline": baseline["daily_steps"] - patient_data["daily_steps"],
            "resting_hr_rise_from_baseline": patient_data["resting_hr_mean"] - baseline["resting_hr_mean"],
        }
        for column, default in delta_defaults.items():
            if column in patient_data:
                features[column] = patient_data[column].fillna(default).reset_index(drop=True)
            elif column == "hrv_drop_from_baseline" and "hrv_drop_frome_baseline" in patient_data:
                features[column] = patient_data["hrv_drop_frome_baseline"].fillna(default).reset_index(drop=True)
            else:
                features[column] = default.reset_index(drop=True)
        scores = model.predict_proba(features[FEATURES])[:, 1]
        telemetry = []
        for day_index, (_, row) in enumerate(patient_data.iterrows(), start=1):
            score = float(scores[day_index - 1])
            telemetry.append({
                "patient_id": int(patient_id),
                "day_index": day_index,
                "timestamp": row["timestamp"].isoformat(),
                "hrv_mean": float(row["hrv_mean"]),
                "resting_hr_mean": float(row["resting_hr_mean"]),
                "mean_hr": float(row["mean_hr"]),
                "sleep_hours": float(row["sleep_hours"]),
                "sleep_efficiency": float(row["sleep_efficiency"]),
                "daily_steps": float(row["daily_steps"]),
                "activity_score": float(row["activity_score"]),
                "risk_event_next_24h": None,
                "risk_score": score,
                "state": "decompensation" if score >= 0.65 else "strain" if score >= 0.25 else "homeostasis",
                "hrv_drop_from_baseline": float(features.iloc[day_index - 1]["hrv_drop_from_baseline"]),
                "resting_hr_rise_from_baseline": float(features.iloc[day_index - 1]["resting_hr_rise_from_baseline"]),
                "sleep_drop_from_baseline": float(features.iloc[day_index - 1]["sleep_drop_from_baseline"]),
                "step_drop_from_baseline": float(features.iloc[day_index - 1]["step_drop_from_baseline"]),
            })

        latest = patient_data.iloc[-1]
        medications = [item.strip() for item in str(latest["medications"]).split(";") if item.strip()]
        profiles.append({
            "ehr": {
                "patient_id": int(patient_id),
                "name": str(latest["name"]),
                "age": int(latest["age"]),
                "sex": str(latest["sex"]),
                "bmi": float(latest["bmi"]),
                "systolic_bp": float(latest["systolic_bp"]),
                "diastolic_bp": float(latest["diastolic_bp"]),
                "cholesterol": float(latest["cholesterol"]),
                "ldl": float(latest["ldl"]) if pd.notna(latest.get("ldl")) else None,
                "hdl": float(latest["hdl"]) if pd.notna(latest.get("hdl")) else None,
                "fasting_glucose": float(latest["fasting_glucose"]) if pd.notna(latest.get("fasting_glucose")) else None,
                "hba1c": float(latest["hba1c"]) if pd.notna(latest.get("hba1c")) else None,
                "family_history": int(latest["family_history"]),
                "smoker": int(latest["smoker"]),
                "diabetes": int(latest["diabetes"]),
                "diagnosis": str(latest["diagnosis"]),
                "medications": medications,
            },
            "current_day": len(telemetry),
            "latest_telemetry": telemetry[-1],
            "telemetry_series": telemetry,
            "hardware": {
                "battery_level": None,
                "ble_rssi": "Not reported",
                "ble_fidelity": None,
                "skin_temp_c": None,
                "device_model": "CSV snapshot",
                "last_sync": telemetry[-1]["timestamp"],
            },
        })
    return profiles


@app.get("/")
def root() -> dict:
    return {
        "message": "CardioTwin API is running",
        "docs": "/docs",
        "health": "/health",
        "demo_risk": "/risk",
        "risk_inference": {"method": "POST", "path": "/api/risk"},
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "project": "CardioTwin"}


@app.get("/api/patients")
def list_patients() -> dict:
    return {"patients": _read_profiles()}


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int) -> dict:
    profiles = _read_profiles()
    for profile in profiles:
        if profile["ehr"]["patient_id"] == patient_id:
            return profile
    raise HTTPException(status_code=404, detail="Patient not found")


@app.get("/api/patients/{patient_id}/risk_timeline")
def get_patient_risk_timeline(patient_id: int) -> dict:
    profiles = _read_profiles()
    for profile in profiles:
        if profile["ehr"]["patient_id"] == patient_id:
            timeline = [
                {
                    "day_index": int(d["day_index"]),
                    "risk_score": float(d["risk_score"]),
                    "risk_percent": round(float(d["risk_score"]) * 100, 1),
                    "state": str(d["state"]),
                }
                for d in profile.get("telemetry_series", [])
            ]
            return {"patient_id": patient_id, "timeline": timeline}
    raise HTTPException(status_code=404, detail="Patient not found")


@app.get("/risk")
def risk_demo() -> dict:
    return {
        "patient_id": 101,
        "risk_score": 0.82,
        "risk_level": "High",
        "explanation": "Low HRV, reduced sleep, and elevated resting heart rate are driving the risk signal.",
    }


@app.post("/api/risk")
def predict_risk(features: RiskInput) -> dict:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")

    model = load_model()
    row = pd.DataFrame([features.model_dump()], columns=FEATURES)
    score = float(model.predict_proba(row)[0][1])
    state = "decompensation" if score >= 0.65 else "strain" if score >= 0.25 else "homeostasis"
    risk_level = "High" if score >= 0.65 else "Moderate" if score >= 0.25 else "Low"

    return {"risk_score": score, "risk_level": risk_level, "state": state}


@app.post("/api/risk/batch")
def predict_risk_batch(payload: BatchRiskInput) -> dict:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")
    if not payload.records:
        return {"predictions": []}

    model = load_model()
    rows = pd.DataFrame([record.model_dump() for record in payload.records], columns=FEATURES)
    scores = model.predict_proba(rows)[:, 1]
    predictions = []
    for score in scores:
        score = float(score)
        state = "decompensation" if score >= 0.65 else "strain" if score >= 0.25 else "homeostasis"
        risk_level = "High" if score >= 0.65 else "Moderate" if score >= 0.25 else "Low"
        predictions.append({"risk_score": score, "risk_level": risk_level, "state": state})
    return {"predictions": predictions}


@app.get("/api/model/importance")
def model_importance() -> dict:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")
    model = load_model()
    importance = sorted(
        zip(FEATURES, model.feature_importances_),
        key=lambda item: item[1],
        reverse=True,
    )
    summary_path = BASE_DIR / "model" / "model_summary.json"
    summary = {}
    if summary_path.exists():
        import json
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
    return {
        "model": "RandomForestClassifier",
        "roc_auc": summary.get("roc_auc"),
        "features": [{"feature": name, "importance": float(value)} for name, value in importance],
    }
