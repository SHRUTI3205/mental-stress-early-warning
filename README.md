# Mental Stress Analytics and Early Warning System

A full-stack data science application for analyzing stress-related behavioral patterns, classifying stress levels, identifying model-important factors, and providing early-warning insights through machine learning and interactive visualization.

## Live Demo

**Frontend:**  
https://mental-stress-early-warning.vercel.app

**Backend API:**  
https://mental-stress-early-warning.onrender.com

**GitHub Repository:**  
https://github.com/SHRUTI3205/mental-stress-early-warning

---

## Overview

Mental Stress Analytics and Early Warning System is a data-driven web application developed to transform stress-related behavioral data into meaningful analytical insights.

The system combines data preprocessing, statistical analysis, machine learning, behavioral pattern analysis, stress classification, early-warning prediction, and interactive visualization in a single web-based platform.

The application provides an interactive dashboard where users can explore stress patterns, participant-level information, model-important factors, behavioral signals, early-warning predictions, and a personal wellness assessment.

The system is designed for educational, analytical, and awareness purposes and is not intended to provide medical diagnosis or treatment.

---

## Objectives

- Analyze stress-related behavioral data using data science techniques.
- Classify observations into different stress levels.
- Identify model-important behavioral and historical stress features.
- Detect potential signs of increasing stress through early-warning prediction.
- Visualize stress patterns and trends through an interactive dashboard.
- Provide a simple personal wellness assessment.
- Present analytical results in an accessible web interface.

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

Users can enter lifestyle and self-reported information including:

- Age
- Sleep duration
- Work/study hours
- Physical activity
- Screen time
- Mood
- Anxiety
- Social interaction
- Perceived workload

The system generates a wellness-oriented stress-risk estimate along with relevant factors and recommendations.

### 4. Stress Trends

The application visualizes changes in stress levels across available observations to help identify patterns and variations over time.

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

The dashboard presents behavioral indicators derived from the processed dataset, including:

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

The system uses Random Forest-based machine learning models for stress analysis and early-warning prediction.

### Current Stress Classification

The current-stress model classifies observations into:

- Low
- Moderate
- High

### Early Warning Prediction

The early-warning model predicts whether an observation is associated with elevated stress on the following day.

### Model Evaluation

The trained models produced the following evaluation results on the held-out test data:

| Task | Accuracy | Balanced Accuracy | F1 |
|---|---:|---:|---:|
| Current Stress Classification | 64.76% | 60.05% | 58.23% Macro F1 |
| Early Warning Prediction | 57.14% | 57.66% | 54.72% F1 |

The early-warning model achieved an ROC-AUC of approximately **0.611**.

These results describe the current models on the available test split and should not be interpreted as clinical performance.

---

## Model-Important Factors

The trained model identifies several features as important for its predictions.

Examples include:

- Rolling stress measures
- Previous stress levels
- Lagged stress observations
- Sleep-related features
- Physical activity indicators
- Behavioral measurements

Feature importance represents predictive importance within the trained model. It does not establish that a particular factor directly causes stress.

---

## Dataset

The project uses the **StudentLife dataset** for behavioral and stress-related analysis.

The dataset contains longitudinal behavioral observations that can be transformed into daily-level analytical features.

### Data Processing Pipeline

```text
StudentLife Dataset
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

The raw dataset is intentionally excluded from the GitHub repository because of its size and data-handling considerations.

The processed dataset required by the application is included separately in the project structure.

System Architecture
                ┌──────────────────────────┐
                │   StudentLife Dataset    │
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Data Processing &         │
                │ Feature Engineering      │
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
                │ Assessment API           │
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
Technology Stack
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
Project Structure
mental-stress-early-warning/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   ├── raw/
│   └── processed/
│       ├── daily_features.csv
│       └── dataset_summary.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
│
├── models/
│   ├── current_stress_model.joblib
│   ├── early_warning_model.joblib
│   ├── feature_importance.csv
│   └── metrics.json
│
├── notebooks/
│
├── src/
│   ├── build_dataset.py
│   └── train.py
│
├── .gitignore
├── README.md
└── requirements.txt
Local Setup
1. Clone the Repository
git clone https://github.com/SHRUTI3205/mental-stress-early-warning.git
cd mental-stress-early-warning
2. Create a Python Virtual Environment
python -m venv .venv

Activate it on Windows:

.venv\Scripts\Activate.ps1
3. Install Python Dependencies
pip install -r requirements.txt
4. Prepare the Dataset

Place the required StudentLife dataset inside:

data/raw/

Then run:

python src/build_dataset.py

This generates:

data/processed/daily_features.csv
5. Train the Models
python src/train.py

The trained models and evaluation files are saved in:

models/
6. Start the Backend
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

The backend will be available at:

http://127.0.0.1:8000
7. Start the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will be available at:

http://localhost:5173
API Endpoints
Endpoint	Method	Purpose
/health	GET	Check API status
/dashboard	GET	Dashboard analytics
/participants	GET	Participant information
/early-warning	GET	Early-warning predictions
/factors	GET	Model-important factors
/metrics	GET	Model evaluation metrics
/behavioral-factors	GET	Behavioral factor information
/assessment	POST	Personal wellness assessment
Deployment

The application is deployed using separate frontend and backend services.

Frontend

The React/Vite frontend is deployed using Vercel.

Live Application:

https://mental-stress-early-warning.vercel.app

Backend

The FastAPI backend is deployed using Render.

Live API:

https://mental-stress-early-warning.onrender.com

The frontend communicates with the deployed FastAPI backend through HTTP API requests.

Privacy and Data Handling

The project follows a privacy-conscious approach.

Raw dataset files are not uploaded to the GitHub repository.
The application does not include a user account system.
The personal assessment is intended as a wellness screening feature.
The system is designed for educational and analytical use.
Results should not be treated as medical diagnosis or treatment recommendations.
Limitations

The current system has several limitations:

The available dataset contains a limited number of participants.
Stress labels may not represent every individual's experience.
Model performance depends on the available features and dataset quality.
The early-warning model provides predictive estimates rather than certainty.
Behavioral feature importance does not establish causality.
The personal assessment is a rule-based wellness screening mechanism rather than a medical diagnostic model.
Results should not be interpreted as clinical diagnosis.
Future Scope

Possible future improvements include:

Larger and more diverse datasets
Personalized stress models
Additional behavioral and physiological signals
Temporal deep-learning models
Explainable AI techniques
Improved early-warning calibration
Mobile application integration
Real-time sensor integration
User-specific longitudinal monitoring
Enhanced privacy controls
Disclaimer

This project is developed for educational, analytical, and awareness purposes.

The predictions, risk categories, and assessment results are not medical diagnoses and should not be used as a replacement for professional mental-health advice, diagnosis, or treatment.

Author

Shruti Sharma

B.Tech — Data Science
S.B. Jain Institute of Technology, Management & Research, Nagpur

License

This project is intended primarily as an academic and educational project.
