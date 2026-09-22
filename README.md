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



See `models/metrics.json` for the exact run produced from the uploaded dataset. Do not copy the old 75% figure into the new README unless a fresh evaluation actually reproduces it under the stated split and feature definition.
