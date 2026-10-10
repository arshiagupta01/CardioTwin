import json
from pathlib import Path

import numpy as np
import pandas as pd


OUTPUT_DIR = Path(__file__).resolve().parent / "sample_patients"
OUTPUT_DIR.mkdir(exist_ok=True)
np.random.seed(42)


def generate_patient(patient_id: int) -> dict:
    age = max(28, min(int(np.random.normal(58, 12)), 85))
    sex = np.random.choice(["M", "F"])
    bmi = round(float(np.clip(np.random.normal(27.5, 4.2), 18.0, 42.0)), 2)
    systolic = max(95, min(int(np.random.normal(132, 16)), 180))
    diastolic = max(60, min(int(np.random.normal(82, 10)), 110))
    cholesterol = round(float(np.clip(np.random.normal(186, 35), 120.0, 280.0)), 1)
    family_history = int(np.random.random() < 0.38)
    smoker = int(np.random.random() < 0.25)
    diabetes = int(np.random.random() < 0.22)

    return {
        "patient_id": patient_id,
        "age": age,
        "sex": sex,
        "bmi": bmi,
        "systolic_bp": systolic,
        "diastolic_bp": diastolic,
        "cholesterol": cholesterol,
        "family_history": family_history,
        "smoker": smoker,
        "diabetes": diabetes,
    }


def main() -> None:
    patients = [generate_patient(i) for i in range(1, 201)]
    df = pd.DataFrame(patients)
    out_path = OUTPUT_DIR / "synthetic_ehr.csv"
    df.to_csv(out_path, index=False)

    print(f"Generated {len(df)} synthetic patient records at {out_path}")


if __name__ == "__main__":
    main()
