# Mental Stress Analytics and Early Warning System

A data-driven web application for analyzing stress-related behavioral patterns, identifying current stress levels, and providing early-warning insights through machine learning and interactive visualization.

## Live Demo

**Frontend:**  
https://mental-stress-early-warning.vercel.app

**Backend API:**  
https://mental-stress-early-warning.onrender.com

**GitHub Repository:**  
https://github.com/SHRUTI3205/mental-stress-early-warning

---

## Overview

Mental Stress Analytics and Early Warning System is a full-stack data science project developed to transform stress-related behavioral data into meaningful analytical insights.

The system combines:

- Data preprocessing
- Statistical analysis
- Machine learning
- Behavioral pattern analysis
- Stress classification
- Early-warning prediction
- Interactive visualization
- Personal wellness assessment

The application provides a dashboard through which users can explore stress trends, participant-level information, model-important factors, behavioral signals, and early-warning results.

The project is designed as an **educational and awareness-oriented analytics system** and is not intended to provide medical diagnosis or treatment.

---

## Key Features

### 1. Mental Stress Dashboard

The overview dashboard provides:

- Total participants
- Stress observations
- Average stress level
- High-stress day count
- Stress distribution
- Stress trajectory
- Model-important factors

### 2. Participant Analysis

The participant section allows exploration of:

- Individual participants
- Number of recorded days
- Average stress level
- Latest stress classification
- Latest available observation date

### 3. Personal Stress Assessment

Users can enter lifestyle and self-reported information such as:

- Age
- Sleep duration
- Work/study hours
- Physical activity
- Screen time
- Mood
- Anxiety
- Social interaction
- Perceived workload

The system generates a wellness-oriented stress-risk estimate together with relevant factors and recommendations.

### 4. Stress Trends

The system visualizes changes in stress levels across available observations to help identify patterns and variations over time.

### 5. Early Warning Centre

A machine-learning-based early-warning model estimates the probability of elevated stress on the following day.

The system provides:

- Participant identifier
- Observation date
- Current stress level
- Warning probability
- Warning status
- Risk category

### 6. Behavioral Signals

The dashboard exposes behavioral indicators derived from the processed dataset, including:

- Audio events
- Activity events
- Wi-Fi events
- App events
- Dark minutes
- Charging minutes
- Conversation events
- Call events
- Lock sessions
- Dark sessions

---

## Machine Learning

Two Random Forest-based models are used in the system.

### Current Stress Classification

The current-stress model classifies observations into:

- Low
- Moderate
- High

### Early Warning Prediction

The early-warning model predicts whether an observation is associated with elevated stress on the following day.

### Model Evaluation

The current trained models achieved the following evaluation results on the held-out test data:

| Task | Accuracy | Balanced Accuracy | F1 |
|---|---:|---:|---:|
| Current Stress Classification | 64.76% | 60.05% | 58.23% Macro F1 |
| Early Warning Prediction | 57.14% | 57.66% | 54.72% |

For the early-warning model, the ROC-AUC was approximately **0.611**.

These metrics describe the current trained model on the available test split and should not be interpreted as clinical performance.

---

## Model-Important Factors

The trained model identifies several features as important for prediction.

Examples include:

- Rolling stress measures
- Previous stress levels
- Lagged stress observations
- Sleep-related features
- Physical activity indicators
- Behavioral measurements

Feature importance represents the contribution of features to the model's predictions. It should **not** be interpreted as proof that a particular factor directly causes stress.

---

## Dataset

The project uses the **StudentLife dataset** for behavioral and stress-related analysis.

The dataset contains longitudinal behavioral observations collected from participants and includes information that can be transformed into daily-level analytical features.

### Processing Pipeline

```text
Raw StudentLife Data
        ↓
Data Extraction
        ↓
Data Cleaning
        ↓
Feature Engineering
        ↓
Daily Feature Dataset
        ↓
Machine Learning Models
        ↓
FastAPI Backend
        ↓
React Dashboard
---

## System Architecture
                ┌──────────────────────────┐
                │   StudentLife Dataset    │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Data Processing &         │
                │ Feature Engineering       │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Random Forest Models     │
                │                          │
                │ • Current Stress         │
                │ • Early Warning          │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │      FastAPI Backend     │
                │                          │
                │ Dashboard API            │
                │ Participants API         │
                │ Early Warning API        │
                │ Assessment API            │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │     React Frontend       │
                │                          │
                │ • Overview               │
                │ • Participants           │
                │ • Personal Assessment    │
                │ • Stress Trends          │
                │ • Early Warning          │
                │ • Behavioral Signals     │
                └──────────────────────────┘
---

## Technology Stack

 Frontend
  React
  Vite
  JavaScript
  CSS
 Backend
  Python
  FastAPI
  Pydantic
  Uvicorn
 Data Science & Machine Learning
  Pandas
  NumPy
  Scikit-learn
  Joblib
 Deployment
  GitHub
  Render
  Vercel


Mental-Stress-Early-Warning/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       └── styles.css
├── data/
│   ├── raw/
│   │   └── PUT_DATASET_HERE.txt
│   └── processed/
│       ├── daily_features.csv
│       └── dataset_summary.json
├── models/
│   ├── current_stress_model.joblib
│   ├── early_warning_model.joblib
│   ├── feature_importance.csv
│   └── metrics.json
├── src/
│   ├── build_dataset.py
│   ├── train.py
│   └── prepare_and_train.sh
└── docs/
    └── REFERENCE_TO_EXISTING_PROJECT.md
```

## Dataset

Use the same Kaggle StudentLife ZIP that was used for the existing project. Rename it to:

`data/raw/studentlife_kaggle.zip`

The ZIP should contain the StudentLife `dataset/EMA/...` folders.

The dataset is **not redistributed in this repository** because it is large. The processed daily table included here is generated from the uploaded dataset for reproducibility of the portfolio prototype.

## Run the data pipeline

From the project root:

```bash
pip install -r requirements.txt
python src/build_dataset.py
python src/train.py
```

The pipeline:

1. Extracts EMA JSON files.
2. Reads Stress, Sleep, Activity, Exercise, Behavior, Mood, Study Spaces, and Events responses.
3. Aggregates responses by participant and day.
4. Preserves the StudentLife stress scale, where lower values indicate more stress.
5. Creates High / Moderate / Low stress classes for analytics.
6. Creates a next-day high-stress target for the early-warning task.
7. Saves model-ready features and trained models.

## Run the FastAPI backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Run the React frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite address shown in the terminal, normally `http://localhost:5173`.

## Dashboard sections

The UI follows the existing project screenshots as the design reference:

- **Overview** — KPI cards, stress trajectory, risk distribution, top factors.
- **Participants** — participant-level summaries.
- **Personal Assessment** — user-entered wellness variables passed through the trained model.
- **Stress Trends** — time-series stress trajectory.
- **Early Warning Centre** — observations ranked by predicted next-day high-stress probability.
- **Behavioral Signals** — model feature importance.

## Evaluation

The upgraded training code uses a **participant-level split** instead of randomly mixing observations from the same participant across train and test. This makes the evaluation more conservative and reduces identity leakage.

See `models/metrics.json` for the exact run produced from the uploaded dataset. Do not copy the old 75% figure into the new README unless a fresh evaluation actually reproduces it under the stated split and feature definition.
