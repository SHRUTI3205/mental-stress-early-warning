from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]

DATA = ROOT / "data" / "processed" / "daily_features.csv"
MODEL_DIR = ROOT / "models"
METRICS = MODEL_DIR / "metrics.json"
BEHAVIORAL_FACTORS = MODEL_DIR / "behavioral_factors.json"


app = FastAPI(
    title="Mental Stress Analytics API",
    version="2.1.0",
    description="Mental Stress Analytics and Early Warning System",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://mental-stress-early-warning.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATA + MODELS
# ============================================================

df = (
    pd.read_csv(DATA, parse_dates=["date"])
    if DATA.exists()
    else pd.DataFrame()
)

current_bundle = (
    joblib.load(MODEL_DIR / "current_stress_model.joblib")
    if (MODEL_DIR / "current_stress_model.joblib").exists()
    else None
)

warning_bundle = (
    joblib.load(MODEL_DIR / "early_warning_model.joblib")
    if (MODEL_DIR / "early_warning_model.joblib").exists()
    else None
)


def safe_float(value, default=0.0):
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


# ============================================================
# ASSESSMENT REQUEST
# ============================================================

class AssessmentRequest(BaseModel):

    age: int = Field(..., ge=13, le=100)

    sleep_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    work_study_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    physical_activity_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    screen_time_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    mood: int = Field(
        ...,
        ge=1,
        le=5
    )

    anxiety: int = Field(
        ...,
        ge=1,
        le=5
    )

    social_interaction: int = Field(
        ...,
        ge=1,
        le=5
    )

    workload: int = Field(
        ...,
        ge=1,
        le=5
    )


# ============================================================
# COMMON CHECK
# ============================================================

def ready():

    if (
        df.empty
        or current_bundle is None
        or warning_bundle is None
    ):
        raise HTTPException(
            status_code=503,
            detail=(
                "Run src/build_dataset.py and "
                "src/train.py first."
            ),
        )


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "rows": len(df),
        "participants": (
            int(df.uid.nunique())
            if not df.empty
            else 0
        ),
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/dashboard")
def dashboard():

    ready()

    d = df.copy()

    latest = (
        d.sort_values("date")
        .tail(1)["date"]
        .iloc[0]
    )

    stress_dist = (
        d["stress_class"]
        .value_counts()
        .reindex(
            ["High", "Moderate", "Low"],
            fill_value=0
        )
    )

    trend = (
        d.groupby(
            "date",
            as_index=False
        )["stress_mean"]
        .mean()
        .tail(45)
    )

    top = (
        pd.read_csv(
            MODEL_DIR / "feature_importance.csv"
        )
        .head(8)
    )

    return {

        "summary": {
            "participants": int(
                d.uid.nunique()
            ),

            "observations": int(
                d["stress_level_count"].sum()
            ),

            "avg_stress": round(
                float(
                    d.stress_mean.mean()
                ),
                2
            ),

            "high_stress_days": int(
                d.high_stress.sum()
            ),

            "latest_date": str(
                latest.date()
            ),
        },

        "trend": [
            {
                "date": str(
                    r.date.date()
                ),

                "stress": round(
                    float(r.stress_mean),
                    2
                ),
            }

            for r in trend.itertuples()
        ],

        "risk_distribution": [
            {
                "name": k,
                "value": int(v)
            }

            for k, v in stress_dist.items()
        ],

        "top_factors": [
            {
                "feature": str(r.feature),
                "importance": round(
                    float(r.importance),
                    4
                ),
            }

            for r in top.itertuples()
        ],
    }


# ============================================================
# PARTICIPANTS
# ============================================================

@app.get("/participants")
def participants():

    ready()

    out = []

    for uid, g in df.groupby("uid"):

        last = (
            g.sort_values("date")
            .iloc[-1]
        )

        out.append(
            {
                "uid": uid,

                "days": int(
                    len(g)
                ),

                "avg_stress": round(
                    float(
                        g.stress_mean.mean()
                    ),
                    2
                ),

                "latest_class": (
                    str(
                        last.stress_class
                    )
                    if pd.notna(
                        last.stress_class
                    )
                    else "Unknown"
                ),

                "latest_date": str(
                    last.date.date()
                ),
            }
        )

    return sorted(
        out,
        key=lambda x: x["avg_stress"],
        reverse=True,
    )


# ============================================================
# EARLY WARNING
# ============================================================

@app.get("/early-warning")
def early_warning():

    ready()

    candidates = df[
        df["next_day_high_stress"].notna()
    ].copy()

    X = candidates[
        warning_bundle["features"]
    ]

    prob = (
        warning_bundle["pipeline"]
        .predict_proba(X)[:, 1]
    )

    candidates["probability"] = prob

    candidates = (
        candidates
        .sort_values(
            "probability",
            ascending=False
        )
        .drop_duplicates("uid")
        .head(30)
    )

    out = []

    for r in candidates.itertuples():

        stress = safe_float(
            r.stress_mean
        )

        if stress >= 4:
            risk = "Critical"

        elif stress >= 3:
            risk = "High"

        elif stress >= 2:
            risk = "Moderate"

        else:
            risk = "Low"

        out.append(
            {
                "uid": str(r.uid),

                "date": str(
                    r.date.date()
                ),

                "stress": round(
                    stress,
                    2
                ),

                "probability": round(
                    float(r.probability),
                    3
                ),

                "warning": bool(
                    r.probability >= 0.5
                ),

                "risk": risk,
            }
        )

    return out


# ============================================================
# BEHAVIORAL FACTORS
# ============================================================

@app.get("/behavioral-factors")
def behavioral_factors():

    ready()

    if BEHAVIORAL_FACTORS.exists():

        with BEHAVIORAL_FACTORS.open(
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    return []


# ============================================================
# FACTORS
# ============================================================

@app.get("/factors")
def factors():

    ready()

    return (
        pd.read_csv(
            MODEL_DIR / "feature_importance.csv"
        )
        .head(15)
        .to_dict(
            orient="records"
        )
    )


# ============================================================
# METRICS
# ============================================================

@app.get("/metrics")
def metrics():

    ready()

    if not METRICS.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Model metrics file not found. "
                "Run src/train.py first."
            ),
        )

    with METRICS.open(
        "r",
        encoding="utf-8"
    ) as f:

        return json.load(f)


# ============================================================
# PERSONAL ASSESSMENT
# ============================================================

@app.post("/assessment")
def assessment(
    data: AssessmentRequest
):

    score = 0.0

    factors = []


    # --------------------------------------------------------
    # Sleep
    # --------------------------------------------------------

    if data.sleep_hours < 5:

        score += 2.0

        factors.append(
            "Very low sleep duration"
        )

    elif data.sleep_hours < 7:

        score += 1.0

        factors.append(
            "Below recommended sleep duration"
        )


    # --------------------------------------------------------
    # Work / Study
    # --------------------------------------------------------

    if data.work_study_hours > 10:

        score += 2.0

        factors.append(
            "High study/work load"
        )

    elif data.work_study_hours > 8:

        score += 1.0

        factors.append(
            "Elevated study/work load"
        )


    # --------------------------------------------------------
    # Physical Activity
    # --------------------------------------------------------

    if data.physical_activity_hours < 0.5:

        score += 1.0

        factors.append(
            "Low physical activity"
        )


    # --------------------------------------------------------
    # Screen Time
    # --------------------------------------------------------

    if data.screen_time_hours > 8:

        score += 1.5

        factors.append(
            "High screen exposure"
        )

    elif data.screen_time_hours > 6:

        score += 0.75

        factors.append(
            "Elevated screen exposure"
        )


    # --------------------------------------------------------
    # Mood
    # Lower mood = higher stress indicator
    # --------------------------------------------------------

    score += (
        5 - data.mood
    ) * 0.7

    if data.mood <= 2:

        factors.append(
            "Low mood reported"
        )


    # --------------------------------------------------------
    # Anxiety
    # --------------------------------------------------------

    score += (
        data.anxiety - 1
    ) * 0.8

    if data.anxiety >= 4:

        factors.append(
            "Elevated anxiety reported"
        )


    # --------------------------------------------------------
    # Social Interaction
    # Lower interaction = higher indicator
    # --------------------------------------------------------

    score += (
        5 - data.social_interaction
    ) * 0.4

    if data.social_interaction <= 2:

        factors.append(
            "Low social interaction"
        )


    # --------------------------------------------------------
    # Workload Perception
    # --------------------------------------------------------

    score += (
        data.workload - 1
    ) * 0.7

    if data.workload >= 4:

        factors.append(
            "High perceived workload"
        )


    # --------------------------------------------------------
    # Normalize to 0-100
    # --------------------------------------------------------

    max_score = 16.0

    percentage = min(
        100,
        max(
            0,
            (score / max_score) * 100
        )
    )


    # --------------------------------------------------------
    # Risk Classification
    # --------------------------------------------------------

    if percentage < 25:

        risk = "Low"

        message = (
            "Your current responses indicate "
            "relatively low stress indicators."
        )

        recommendations = [
            "Continue maintaining a regular sleep schedule.",
            "Keep some physical activity in your routine.",
            "Maintain healthy social connections.",
        ]


    elif percentage < 50:

        risk = "Moderate"

        message = (
            "Some stress-related indicators are elevated. "
            "Consider making small changes to your routine."
        )

        recommendations = [
            "Aim for consistent and sufficient sleep.",
            "Take regular breaks during study or work.",
            "Reduce prolonged screen exposure.",
            "Include regular physical activity.",
        ]


    elif percentage < 75:

        risk = "High"

        message = (
            "Several stress indicators are elevated. "
            "Your current routine may benefit from "
            "attention and additional support."
        )

        recommendations = [
            "Prioritize sleep and recovery.",
            "Break large workloads into smaller tasks.",
            "Take regular screen-free breaks.",
            "Increase physical activity gradually.",
            "Talk with someone you trust about how you are feeling.",
        ]


    else:

        risk = "Critical"

        message = (
            "Your responses indicate a high level of "
            "stress-related indicators. Consider reaching "
            "out to a qualified mental-health professional "
            "or trusted support person."
        )

        recommendations = [
            "Prioritize rest and recovery.",
            "Reduce excessive workload where possible.",
            "Stay connected with trusted people.",
            "Consider speaking with a qualified mental-health professional.",
        ]


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "score": round(
            percentage,
            1
        ),

        "risk": risk,

        "message": message,

        "factors": factors[:6],

        "recommendations": recommendations,

        "disclaimer": (
            "This assessment is a wellness screening tool "
            "and is not a medical diagnosis."
        ),
    }