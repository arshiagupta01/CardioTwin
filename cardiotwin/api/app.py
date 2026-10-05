from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="CardioTwin API")
BASE_DIR = Path(__file__).resolve().parents[1]
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


@lru_cache(maxsize=1)
def load_model():
    return joblib.load(MODEL_PATH)


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
