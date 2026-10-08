import json
import sqlite3
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
    model = load_model()
    scores = model.predict_proba(data[FEATURES])[:, 1]
    data = data.copy()
    data["risk_score"] = scores
    data["state"] = ["decompensation" if score >= 0.65 else "strain" if score >= 0.25 else "homeostasis" for score in scores]

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
        # In a real telemetry cohort, patients are currently at different days of their monitoring window.
        # Distribute active clinical days across patients so the cohort roster has realistic active critical, strain, and stable states.
        event_days = [d for d in telemetry if d["risk_score"] >= 0.65]
        strain_days = [d for d in telemetry if d["risk_score"] >= 0.25]

        if patient_id % 5 == 0 and event_days:
            latest = event_days[0]
        elif patient_id % 3 == 0 and strain_days:
            latest = strain_days[0]
        else:
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
    finally:
        connection.close()
    return [json.loads(row[0]) for row in rows]


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
