# CardioTwin

CardioTwin is a digital-twin prototype that reads patient and wearable observations from a configured CSV source and scores them with a cardiovascular risk model.

## Project overview

This project combines:

- static patient features such as age, BMI, blood pressure, cholesterol, family history, smoking status, and diabetes
- dynamic wearable fields such as HRV, resting heart rate, sleep quality, sleep hours, and daily steps
- a machine-learning model that estimates whether a patient may have a high-risk cardiovascular event in the next 24–48 hours

This is a research and demo project intended for educational, prototype, and presentation use, not a clinical diagnosis system.

## Why this project exists

The dashboard reads from the configured CSV source and does not fall back to the bundled synthetic cohort. The checked-in `live_patients.csv` is a supplied, single-timestamp snapshot with 99 complete records; the pasted PID_034 row was incomplete and is omitted. Replace or update this file with an authorized, current feed to receive changing observations. Synthetic generation scripts remain available for model development and integration testing, but are not a source of real patient data.

## Project structure

- `generate_data.py` — creates synthetic patient profiles and wearable time-series data
- `train_model.py` — trains the risk prediction model and saves the model artifact
- `frontend/` — React/TypeScript dashboard
- `requirements.txt` — Python package dependencies
- `data/` — generated patient and wearable data files
- `models/` — trained model and metadata

## Setup

### 1) Create a virtual environment

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt -r cardiotwin/requirements.txt
```

### 3) Configure the live CSV feed

The API reads `cardiotwin/data/live_patients.csv` by default. Set `CARDIOTWIN_LIVE_CSV_PATH` to an absolute path to use a different CSV. The file must contain one row per patient observation, with EHR fields repeated for each row. Append new timestamped rows as observations arrive; the dashboard rereads the file every 30 seconds. Polling a static file does not make its data live.

Required CSV columns (the feed schema you pasted is accepted):

```text
patient_id,timestamp,age,sex,bmi,systolic_bp,diastolic_bp,cholesterol,family_history,smoker,diabetes,hrv_mean,resting_hr_mean,mean_hr,sleep_hours,sleep_efficiency,daily_steps,activity_score
```

Use numeric patient IDs or IDs ending in digits (for example `PID_001`), `M` or `F` for `sex`, and ISO 8601 timestamps (preferably with a timezone). Optional EHR columns are `name`, `diagnosis`, `medications`, `ldl`, `hdl`, `fasting_glucose`, and `hba1c`; absent lab values display as `N/A`. Optional baseline-delta columns are `hrv_drop_from_baseline`, `sleep_drop_from_baseline`, `step_drop_from_baseline`, and `resting_hr_rise_from_baseline`. For compatibility, the API also accepts the typo `hrv_drop_frome_baseline`. If no deltas are supplied, it derives them from the first observation for each patient. The API reports missing or invalid feed data instead of loading the bundled cohort. The live feed is read-only; update the source CSV to change records.

To create schema-compatible synthetic test scenarios, run:

```bash
python cardiotwin/data/generate_model_scenarios.py
```

This writes four 100-patient scenario files and `cardiotwin/data/synthetic_model_scenarios/patient_data_all_scenarios.csv` (400 longitudinal observations). To demo the model against that synthetic history, point `CARDIOTWIN_LIVE_CSV_PATH` to the combined file. These generated files are for integration/testing only; they are not live or real patient data, and should not be used for clinical decisions or model training.

Set the path before starting the API. In PowerShell:

```powershell
$env:CARDIOTWIN_LIVE_CSV_PATH = "D:\data\cardiotwin-live.csv"
```

On macOS/Linux:

```bash
export CARDIOTWIN_LIVE_CSV_PATH=/data/cardiotwin-live.csv
```

### 4) Train or update the model (optional)

The included training pipeline still uses generated data. Do not treat its predictions on a different live population as clinically validated; validate and retrain with appropriately governed, representative data before operational use.

```bash
python cardiotwin/data/generate_ehr.py
python cardiotwin/data/wearable_sim.py
python cardiotwin/fusion/feature_pipeline.py
python cardiotwin/model/train.py
```

### 5) Launch the backend API

In a terminal from the repository root, install the API dependencies and start FastAPI:

```bash
pip install -r cardiotwin/requirements.txt
uvicorn cardiotwin.api.app:app --reload --port 8000
```

The trained model must be available at `cardiotwin/model/cardiotwin_model.joblib`.

### 6) Launch the React dashboard

```bash
cd frontend
npm install
npm run dev
```

Then open the local URL displayed by Vite.
The Vite development server proxies `/api` requests to the backend on port 8000.

## How the model works

The model uses a combined feature set:

- demographic and risk factors: age, sex, BMI, BP, cholesterol, family history, smoking, diabetes
- wearable signals: HRV, resting heart rate, mean heart rate, sleep hours, sleep efficiency, steps, activity score
- target: risk_event_next_24h

A Random Forest classifier is used to create a transparent and interpretable prediction model suitable for a healthcare demo.

## Dashboard features

- patient selection panel
- digital-twin summary card
- risk score and alert level
- trend plots for HRV, resting heart rate, sleep, and activity
- explanation of the top contributing features

## Share this project with friends

### Option A: Share via GitHub

1. Create a new public or private repository on GitHub.
2. Push this project folder to the repository.
3. Add a short description and this README.
4. Share the repository link with friends.

Example Git commands:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Option B: Share as a ZIP file

1. Compress the project folder into a zip archive.
2. Send the ZIP to your friends.
3. Ask them to unzip it and run:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python generate_data.py
python train_model.py
cd frontend
npm install
npm run dev
```

## Suggested message to send
> Hey, I built this healthcare AI prototype and shared it here for you to explore. Please download or clone the project, install the dependencies from the requirements file, and follow the setup instructions in the README to run the model and React dashboard locally.

## Notes

- This is a proof-of-concept project.
- Risk-model training data is synthetic; live-feed inference is a prototype and is not clinically validated.
- It is not intended for real medical decision-making or patient care.

## License

This project is intended for educational and demonstration purposes.
