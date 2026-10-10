import json
import sqlite3
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="CardioTwin API")
BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "model" / "cardiotwin_model.joblib"
CALIBRATOR_PATH = BASE_DIR / "model" / "cardiotwin_calibrator.joblib"
SUMMARY_PATH = BASE_DIR / "model" / "model_summary.json"
DATA_DIR = BASE_DIR / "data" / "sample_patients"
PATIENT_DB = BASE_DIR / "data" / "cardiotwin.sqlite3"
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


@lru_cache(maxsize=1)
def load_calibrator():
    if not CALIBRATOR_PATH.exists():
        return None
    return joblib.load(CALIBRATOR_PATH)


@lru_cache(maxsize=1)
def load_model_summary() -> dict:
    if not SUMMARY_PATH.exists():
        return {}
    return json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))


def predict_probabilities(rows: pd.DataFrame):
    raw_scores = load_model().predict_proba(rows)[:, 1]
    calibrator = load_calibrator()
    if calibrator is None:
        return raw_scores
    return calibrator.predict_proba(raw_scores.reshape(-1, 1))[:, 1]


def classify_risk(score: float) -> tuple[str, str]:
    thresholds = load_model_summary().get("thresholds", {})
    strain_threshold = float(thresholds.get("strain", 0.25))
    high_threshold = float(thresholds.get("high_risk", 0.65))
    if score >= high_threshold:
        return "decompensation", "High"
    if score >= strain_threshold:
        return "strain", "Moderate"
    return "homeostasis", "Low"


def _connect_patient_db() -> sqlite3.Connection:
    PATIENT_DB.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(PATIENT_DB)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS patients (patient_id INTEGER PRIMARY KEY, profile_json TEXT NOT NULL)"
    )
    return connection


def _seed_patient_db(connection: sqlite3.Connection) -> None:
    count = connection.execute("SELECT COUNT(*) FROM patients").fetchone()[0]
    if count:
        return
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")

    ehr_df = pd.read_csv(DATA_DIR / "synthetic_ehr.csv")
    data = pd.read_csv(DATA_DIR / "fused_dataset.csv").sort_values(["patient_id", "day_index"])
    data["sex"] = data["sex"].map({"M": 1, "F": 0}).fillna(data["sex"])
    scores = predict_probabilities(data[FEATURES])
    data = data.copy()
    data["risk_score"] = scores
    data["state"] = [classify_risk(float(score))[0] for score in scores]

    profiles = []
    for _, ehr_row in ehr_df.iterrows():
        patient_id = int(ehr_row["patient_id"])
        patient_days = data[data["patient_id"] == patient_id]
        ehr = {
            "patient_id": patient_id,
            "name": f"Patient {patient_id}",
            "age": int(ehr_row["age"]),
            "sex": str(ehr_row["sex"]),
            "bmi": float(ehr_row["bmi"]),
            "systolic_bp": int(ehr_row["systolic_bp"]),
            "diastolic_bp": int(ehr_row["diastolic_bp"]),
            "cholesterol": round(float(ehr_row["cholesterol"]), 1),
            "ldl": round(float(ehr_row["cholesterol"]) * 0.62, 1),
            "hdl": round(float(ehr_row["cholesterol"]) * 0.2, 1),
            "fasting_glucose": 92 + int(ehr_row["diabetes"]) * 30,
            "hba1c": round(5.4 + int(ehr_row["diabetes"]) * 1.6, 1),
            "family_history": int(ehr_row["family_history"]),
            "smoker": int(ehr_row["smoker"]),
            "diabetes": int(ehr_row["diabetes"]),
            "diagnosis": "Hypertension" if float(ehr_row["systolic_bp"]) >= 130 or float(ehr_row["diastolic_bp"]) >= 80 else "Cardiovascular risk monitoring",
            "medications": [],
        }
        telemetry = []
        for _, day in patient_days.iterrows():
            telemetry.append({
                "patient_id": patient_id,
                "day_index": int(day["day_index"]),
                "hrv_mean": float(day["hrv_mean"]),
                "resting_hr_mean": float(day["resting_hr_mean"]),
                "mean_hr": float(day["mean_hr"]),
                "sleep_hours": float(day["sleep_hours"]),
                "sleep_efficiency": float(day["sleep_efficiency"]),
                "daily_steps": float(day["daily_steps"]),
                "activity_score": float(day["activity_score"]),
                "risk_event_next_24h": int(day["risk_event_next_24h"]),
                "risk_score": float(day["risk_score"]),
                "state": str(day["state"]),
                "hrv_drop_from_baseline": float(day["hrv_drop_from_baseline"]),
                "resting_hr_rise_from_baseline": float(day["resting_hr_rise_from_baseline"]),
                "sleep_drop_from_baseline": float(day["sleep_drop_from_baseline"]),
                "step_drop_from_baseline": float(day["step_drop_from_baseline"]),
            })
        latest = telemetry[-1]
        profiles.append({
            "ehr": ehr,
            "current_day": latest["day_index"],
            "latest_telemetry": latest,
            "telemetry_series": telemetry,
            "hardware": {
                "battery_level": 94,
                "ble_rssi": "-62 dBm",
                "ble_fidelity": 98.4,
                "skin_temp_c": 36.8,
                "device_model": "Synthetic wearable feed",
                "last_sync": "Synthetic dataset",
            },
        })
    connection.executemany(
        "INSERT INTO patients (patient_id, profile_json) VALUES (?, ?)",
        [(profile["ehr"]["patient_id"], json.dumps(profile)) for profile in profiles],
    )
    connection.commit()


def _read_profiles() -> list[dict]:
    connection = _connect_patient_db()
    try:
        with connection:
            _seed_patient_db(connection)
            rows = connection.execute("SELECT profile_json FROM patients ORDER BY patient_id").fetchall()
            profiles = [json.loads(row[0]) for row in rows]
            feature_rows = []
            positions = []
            for profile_index, profile in enumerate(profiles):
                ehr = profile["ehr"]
                telemetry = profile["telemetry_series"]
                if not telemetry:
                    continue
                baseline = telemetry[0]
                for day_index, day in enumerate(telemetry):
                    feature_rows.append({
                        "age": ehr["age"],
                        "sex": 1 if ehr["sex"] == "M" else 0,
                        "bmi": ehr["bmi"],
                        "systolic_bp": ehr["systolic_bp"],
                        "diastolic_bp": ehr["diastolic_bp"],
                        "cholesterol": ehr["cholesterol"],
                        "family_history": ehr["family_history"],
                        "smoker": ehr["smoker"],
                        "diabetes": ehr["diabetes"],
                        "hrv_mean": day["hrv_mean"],
                        "resting_hr_mean": day["resting_hr_mean"],
                        "mean_hr": day["mean_hr"],
                        "sleep_hours": day["sleep_hours"],
                        "sleep_efficiency": day["sleep_efficiency"],
                        "daily_steps": day["daily_steps"],
                        "activity_score": day["activity_score"],
                        "hrv_drop_from_baseline": baseline["hrv_mean"] - day["hrv_mean"],
                        "sleep_drop_from_baseline": baseline["sleep_hours"] - day["sleep_hours"],
                        "step_drop_from_baseline": baseline["daily_steps"] - day["daily_steps"],
                        "resting_hr_rise_from_baseline": day["resting_hr_mean"] - baseline["resting_hr_mean"],
                    })
                    positions.append((profile_index, day_index))
            if feature_rows:
                scores = predict_probabilities(pd.DataFrame(feature_rows, columns=FEATURES))
                for (profile_index, day_index), score in zip(positions, scores):
                    day = profiles[profile_index]["telemetry_series"][day_index]
                    day["risk_score"] = float(score)
                    day["state"] = classify_risk(float(score))[0]
                for profile in profiles:
                    telemetry = profile["telemetry_series"]
                    if telemetry:
                        profile["latest_telemetry"] = next(
                            (day for day in telemetry if day["day_index"] == profile["current_day"]), telemetry[-1]
                        )
                connection.executemany(
                    "UPDATE patients SET profile_json = ? WHERE patient_id = ?",
                    [(json.dumps(profile), profile["ehr"]["patient_id"]) for profile in profiles],
                )
    finally:
        connection.close()
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


@app.put("/api/patients/{patient_id}")
def save_patient(patient_id: int, profile: dict) -> dict:
    try:
        profile_id = int(profile["ehr"]["patient_id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Patient profile must include ehr.patient_id")
    if profile_id != patient_id:
        raise HTTPException(status_code=422, detail="Path patient ID must match ehr.patient_id")

    connection = _connect_patient_db()
    try:
        with connection:
            _seed_patient_db(connection)
            connection.execute(
                "INSERT INTO patients (patient_id, profile_json) VALUES (?, ?) "
                "ON CONFLICT(patient_id) DO UPDATE SET profile_json = excluded.profile_json",
                (patient_id, json.dumps(profile)),
            )
    finally:
        connection.close()
    return profile


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

    row = pd.DataFrame([features.model_dump()], columns=FEATURES)
    score = float(predict_probabilities(row)[0])
    state, risk_level = classify_risk(score)

    return {"risk_score": score, "risk_level": risk_level, "state": state}


@app.post("/api/risk/batch")
def predict_risk_batch(payload: BatchRiskInput) -> dict:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="The trained risk model is not available")
    if not payload.records:
        return {"predictions": []}

    rows = pd.DataFrame([record.model_dump() for record in payload.records], columns=FEATURES)
    scores = predict_probabilities(rows)
    predictions = []
    for score in scores:
        score = float(score)
        state, risk_level = classify_risk(score)
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
    summary = load_model_summary()
    return {
        "model": summary.get("model", "Unknown"),
        "roc_auc": summary.get("roc_auc"),
        "validation_data": summary.get("validation_data"),
        "clinical_use": summary.get("clinical_use", False),
        "features": [{"feature": name, "importance": float(value)} for name, value in importance],
    }
