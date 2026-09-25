import json
from pathlib import Path

import joblib
import pandas as pd
import plotly.graph_objects as go
import streamlit as st


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "cardiotwin_model.joblib"
META_PATH = BASE_DIR / "models" / "cardiotwin_model_meta.json"
EHR_PATH = BASE_DIR / "data" / "ehr_profiles.csv"
WEARABLE_PATH = BASE_DIR / "data" / "wearable_history.csv"
COMBINED_PATH = BASE_DIR / "data" / "patient_day_dataset.csv"


st.set_page_config(page_title="CardioTwin Dashboard", layout="wide")


@st.cache_data
def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, dict]:
    ehr = pd.read_csv(EHR_PATH)
    wearable = pd.read_csv(WEARABLE_PATH)
    combined = pd.read_csv(COMBINED_PATH)
    meta = json.loads(META_PATH.read_text())
    return ehr, wearable, combined, meta


@st.cache_resource
def load_model():
    return joblib.load(MODEL_PATH)


def explain_risk(row: pd.Series, model) -> tuple[float, list[tuple[str, str]]]:
    feature_values = row[model.feature_names_in_]
    importances = model.feature_importances_
    ranked = sorted(zip(model.feature_names_in_, importances), key=lambda x: x[1], reverse=True)
    top_features = ranked[:5]

    score = model.predict_proba(feature_values.to_frame().T)[0][1]

    reason_map = {
        "hrv_mean": "Low heart-rate variability is a common early signal of stress and cardiovascular strain.",
        "resting_hr_mean": "Rising resting heart rate can indicate worsening autonomic stress or early physiologic imbalance.",
        "sleep_hours": "Poor or shortened sleep reduces recovery and increases risk susceptibility.",
        "sleep_efficiency": "Fragmented or low-quality sleep is strongly associated with higher future cardiovascular risk.",
        "daily_steps": "Reduced physical activity can reflect declining fitness and higher vulnerability.",
        "bmi": "A higher BMI can contribute to elevated overall cardiometabolic strain.",
        "age": "Age increases baseline cardiovascular vulnerability.",
        "cholesterol": "Elevated cholesterol raises long-term vascular risk and may worsen acute episodes.",
        "systolic_bp": "Blood pressure trends matter because rising pressures are linked to hypertensive risk.",
    }

    reasons = []
    for feature_name, _ in top_features:
        details = reason_map.get(feature_name, "This feature is contributing to the composite risk profile.")
        reasons.append((feature_name, details))

    return float(score), reasons


def build_summary_cards(patient_row):
    st.subheader("Patient digital twin")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Age", f"{int(patient_row['age'])} y")
    col2.metric("BMI", f"{patient_row['bmi']:.1f}")
    col3.metric("BP", f"{int(patient_row['systolic_bp'])}/{int(patient_row['diastolic_bp'])}")
    col4.metric("Cholesterol", f"{patient_row['cholesterol']:.1f} mg/dL")


def main():
    ehr, wearable, combined, meta = load_data()
    model = load_model()

    st.title("CardioTwin — Digital Twin Risk Monitor")
    st.caption("Synthetic patient cohort for cardiovascular risk prediction demo")

    patient_ids = sorted(ehr["patient_id"].unique())
    patient_id = st.selectbox("Select patient", patient_ids)

    patient_ehr = ehr[ehr["patient_id"] == patient_id].iloc[0]
    patient_record = combined[combined["patient_id"] == patient_id].sort_values("day_index")
    latest = patient_record.iloc[-1]

    risk_score, reasons = explain_risk(latest, model)
    risk_level = "HIGH" if risk_score >= 0.6 else "MODERATE" if risk_score >= 0.4 else "LOW"

    build_summary_cards(patient_ehr)

    col1, col2, col3 = st.columns([1.4, 1.4, 1.8])
    with col1:
        st.metric("Risk score", f"{risk_score:.2f}")
    with col2:
        st.metric("Current status", risk_level)
    with col3:
        st.progress(min_value=0.0, max_value=1.0, value=risk_score)

    if risk_level == "HIGH":
        st.warning("Clinical flag: elevated risk episode likely within the next 24–48 hours.")
    elif risk_level == "MODERATE":
        st.info("Watch closely: rising stress and sleep signals suggest increasing risk.")
    else:
        st.success("Low immediate risk based on current digital twin signal profile.")

    st.markdown("### Trends")
    chart_cols = st.columns(2)

    with chart_cols[0]:
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=patient_record["day_index"], y=patient_record["hrv_mean"], mode="lines+markers", name="HRV"))
        fig.add_trace(go.Scatter(x=patient_record["day_index"], y=patient_record["resting_hr_mean"], mode="lines+markers", name="Resting HR"))
        fig.update_layout(title="HRV and resting heart rate", xaxis_title="Day", yaxis_title="Value")
        st.plotly_chart(fig, use_container_width=True)

    with chart_cols[1]:
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=patient_record["day_index"], y=patient_record["sleep_hours"], mode="lines+markers", name="Sleep hours"))
        fig2.add_trace(go.Scatter(x=patient_record["day_index"], y=patient_record["sleep_efficiency"], mode="lines+markers", name="Sleep efficiency"))
        fig2.add_trace(go.Scatter(x=patient_record["day_index"], y=patient_record["daily_steps"], mode="lines+markers", name="Steps"))
        fig2.update_layout(title="Sleep and activity trends", xaxis_title="Day", yaxis_title="Value")
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### Why this score is elevated")
    for feature_name, explanation in reasons:
        st.write(f"- {feature_name}: {explanation}")

    st.markdown("### EHR snapshot")
    st.dataframe(
        patient_ehr.to_frame().rename({0: "value"}).T[[
            "patient_id",
            "age",
            "sex",
            "bmi",
            "systolic_bp",
            "diastolic_bp",
            "cholesterol",
            "family_history",
            "smoker",
            "diabetes",
        ]],
        use_container_width=True,
    )

    st.caption(f"Model metadata: {meta}")


if __name__ == "__main__":
    main()
