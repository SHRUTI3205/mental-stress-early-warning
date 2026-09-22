# Mental Stress Analytics & Early Warning System

### Portfolio upgrade of the existing 7th-semester project

This repository upgrades the existing **Mental Stress Analytics and Early Warning System** documented in the submitted project report. The existing work used the Dartmouth StudentLife dataset, a Random Forest model, a FastAPI backend, and a React dashboard with stress trajectory, risk distribution, important features, personal assessment, and early-warning views.

The new version keeps that architecture and visual direction, but makes the data pipeline reproducible and adds participant-level evaluation, explicit feature engineering, model artifacts, and a clearer separation between current stress analytics and next-day early warning.

> **Important:** this is an educational/research wellness analytics prototype. It is not a medical diagnostic or treatment system.

## Project structure

```text
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
