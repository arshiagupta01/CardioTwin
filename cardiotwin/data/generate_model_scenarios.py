import csv
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path


OUTPUT_DIR = Path(__file__).resolve().parent / "synthetic_model_scenarios"
PATIENT_COUNT = 100
SEED = 2026
FIELDS = [
    "patient_id", "name", "age", "sex", "bmi", "systolic_bp", "diastolic_bp",
    "cholesterol", "ldl", "hdl", "fasting_glucose", "hba1c", "family_history",
    "smoker", "diabetes", "diagnosis", "medications", "timestamp", "hrv_mean",
    "resting_hr_mean", "mean_hr", "sleep_hours", "sleep_efficiency", "daily_steps",
    "activity_score",
]
SCENARIOS = (
    "baseline",
    "stress_event",
    "recovery_active",
    "erratic_live",
)


def bounded(value: float, minimum: float, maximum: float) -> float:
    return min(maximum, max(minimum, value))


def build_patients(rng: random.Random) -> list[dict]:
    patients = []
    for patient_id in range(1, PATIENT_COUNT + 1):
        sex = rng.choice(("M", "F"))
        diabetes = rng.choices((0, 1), weights=(0.84, 0.16))[0]
        cholesterol = rng.randint(155, 255)
        patients.append({
            "patient_id": patient_id,
            "name": f"Synthetic Patient {patient_id:03d}",
            "age": rng.randint(30, 78),
            "sex": sex,
            "bmi": round(rng.uniform(19.0, 35.0), 1),
            "systolic_bp": rng.randint(108, 132),
            "diastolic_bp": rng.randint(66, 86),
            "cholesterol": cholesterol,
            "ldl": round(cholesterol * 0.62, 1),
            "hdl": round(cholesterol * 0.2, 1),
            "fasting_glucose": rng.randint(85, 115) + diabetes * rng.randint(15, 35),
            "hba1c": round(rng.uniform(5.0, 5.9) + diabetes * rng.uniform(1.0, 2.1), 1),
            "family_history": rng.choices((0, 1), weights=(0.68, 0.32))[0],
            "smoker": rng.choices((0, 1), weights=(0.82, 0.18))[0],
            "diabetes": diabetes,
            "baseline_hrv": rng.uniform(38, 76),
            "baseline_resting_hr": rng.uniform(57, 79),
            "baseline_sleep": rng.uniform(6.3, 8.4),
            "baseline_steps": rng.randint(3500, 11500),
        })
    return patients


def make_record(patient: dict, scenario: str, timestamp: datetime, rng: random.Random) -> dict:
    hrv = patient["baseline_hrv"]
    resting_hr = patient["baseline_resting_hr"]
    sleep_hours = patient["baseline_sleep"]
    sleep_efficiency = rng.uniform(0.8, 0.94)
    daily_steps = patient["baseline_steps"]
    systolic_bp = patient["systolic_bp"]
    diastolic_bp = patient["diastolic_bp"]

    if scenario == "stress_event":
        hrv -= rng.uniform(10, 24)
        resting_hr += rng.uniform(6, 17)
        sleep_hours -= rng.uniform(0.8, 2.6)
        sleep_efficiency -= rng.uniform(0.08, 0.24)
        daily_steps -= rng.randint(1000, 4500)
        systolic_bp += rng.randint(8, 26)
        diastolic_bp += rng.randint(4, 16)
    elif scenario == "recovery_active":
        hrv += rng.uniform(3, 14)
        resting_hr -= rng.uniform(2, 8)
        sleep_hours += rng.uniform(0.2, 1.2)
        sleep_efficiency += rng.uniform(0.02, 0.08)
        daily_steps += rng.randint(1000, 5000)
        systolic_bp -= rng.randint(2, 10)
        diastolic_bp -= rng.randint(1, 7)
    elif scenario == "erratic_live":
        hrv += rng.uniform(-17, 17)
        resting_hr += rng.uniform(-11, 13)
        sleep_hours += rng.uniform(-2.2, 1.8)
        sleep_efficiency += rng.uniform(-0.2, 0.08)
        daily_steps += rng.randint(-3500, 4000)
        systolic_bp += rng.randint(-12, 28)
        diastolic_bp += rng.randint(-8, 18)

    hrv = bounded(hrv, 8, 105)
    resting_hr = bounded(resting_hr, 42, 125)
    sleep_hours = bounded(sleep_hours, 2, 11)
    sleep_efficiency = bounded(sleep_efficiency, 0.45, 0.99)
    daily_steps = bounded(daily_steps, 0, 25000)
    systolic_bp = bounded(systolic_bp, 85, 195)
    diastolic_bp = bounded(diastolic_bp, 45, 120)
    mean_hr = bounded(resting_hr + rng.uniform(10, 25), 45, 175)
    activity_score = bounded((daily_steps / 12000 * 70) + (sleep_efficiency * 30), 0, 100)
    diagnosis = (
        "Hypertension" if systolic_bp >= 130 or diastolic_bp >= 80
        else "Cardiovascular risk monitoring"
    )

    record = {key: patient[key] for key in FIELDS if key in patient}
    record.update({
        "systolic_bp": round(systolic_bp, 1),
        "diastolic_bp": round(diastolic_bp, 1),
        "diagnosis": diagnosis,
        "medications": "",
        "timestamp": timestamp.isoformat(),
        "hrv_mean": round(hrv, 2),
        "resting_hr_mean": round(resting_hr, 2),
        "mean_hr": round(mean_hr, 2),
        "sleep_hours": round(sleep_hours, 2),
        "sleep_efficiency": round(sleep_efficiency, 3),
        "daily_steps": round(daily_steps, 1),
        "activity_score": round(activity_score, 2),
    })
    return record


def write_csv(path: Path, records: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)


def main() -> None:
    rng = random.Random(SEED)
    patients = build_patients(rng)
    first_timestamp = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours=18)
    all_records = []
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for scenario_index, scenario in enumerate(SCENARIOS):
        timestamp = first_timestamp + timedelta(hours=6 * scenario_index)
        records = [make_record(patient, scenario, timestamp, rng) for patient in patients]
        output_path = OUTPUT_DIR / f"patient_data_{scenario_index + 1:02d}_{scenario}.csv"
        write_csv(output_path, records)
        all_records.extend(records)
        print(f"Wrote {output_path} ({len(records)} rows)")

    all_records.sort(key=lambda record: (record["patient_id"], record["timestamp"]))
    combined_path = OUTPUT_DIR / "patient_data_all_scenarios.csv"
    write_csv(combined_path, all_records)
    print(f"Wrote {combined_path} ({len(all_records)} rows)")
    print("Synthetic test data only; not real patient or wearable data.")


if __name__ == "__main__":
    main()