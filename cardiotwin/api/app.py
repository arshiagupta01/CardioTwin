from fastapi import FastAPI

app = FastAPI(title="CardioTwin API")


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
