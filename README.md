# CardioTwin

CardioTwin is a synthetic digital-twin healthcare prototype for predicting short-term cardiovascular risk using fused electronic health record (EHR) attributes and wearable health signals.

## Project overview

This project combines:

- static patient features such as age, BMI, blood pressure, cholesterol, family history, smoking status, and diabetes
- dynamic wearable fields such as HRV, resting heart rate, sleep quality, sleep hours, and daily steps
- a machine-learning model that estimates whether a patient may have a high-risk cardiovascular event in the next 24–48 hours

This is a research and demo project intended for educational, prototype, and presentation use, not a clinical diagnosis system.

## Why this project exists

Healthcare innovation often starts with synthetic data because real medical records are sensitive and difficult to access. This project creates a realistic, privacy-safe sandbox where a digital twin can be explored, visualized, and explained in a way that is understandable to non-technical stakeholders.

## Project structure

- `generate_data.py` — creates synthetic patient profiles and wearable time-series data
- `train_model.py` — trains the risk prediction model and saves the model artifact
- `dashboard.py` — Streamlit-based dashboard for visualizing patient risk and trends
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
pip install -r requirements.txt
```

### 3) Generate the synthetic data

```bash
python generate_data.py
```

### 4) Train the model

```bash
python train_model.py
```

### 5) Launch the dashboard

```bash
streamlit run dashboard.py
```

Then open the local URL displayed in the terminal.

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
streamlit run dashboard.py
```

## Suggested message to send

> Hey, I built this healthcare AI prototype and shared it here for you to explore. Please download or clone the project, install the dependencies from the requirements file, and follow the setup instructions in the README to run the dashboard locally.

## Notes

- This is a proof-of-concept project.
- It uses synthetic data only.
- It is not intended for real medical decision-making or patient care.

## License

This project is intended for educational and demonstration purposes.
