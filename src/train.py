"""Train the two models used by the portfolio prototype.

1) Current-stress analytics: 3-class High / Moderate / Low classification.
2) Early-warning model: binary prediction of high stress on the next observed day.

Evaluation uses a participant-level split to reduce identity leakage.
"""
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "processed" / "daily_features.csv"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(exist_ok=True)


def numeric_features(df, excluded):
    return [
        c
        for c in df.columns
        if c not in excluded and pd.api.types.is_numeric_dtype(df[c])
    ]


def make_pipe(model):
    return Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", model),
        ]
    )


def main():
    df = pd.read_csv(DATA, parse_dates=["date"])
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.25,
        random_state=42,
    )

    metrics = {}

    # ============================================================
    # CURRENT STRESS CLASSIFIER
    # ============================================================

    cur = df[df["stress_class"].notna()].copy()

    excluded = {
        "uid",
        "date",
        "stress_class",
        "stress_mean",
        "high_stress",
        "next_day_high_stress",
    }

    excluded.update(
        c for c in cur.columns if c.startswith("stress_level_")
    )

    excluded.update(
        {
            "stress_lag1",
            "stress_lag2",
            "stress_lag3",
            "stress_roll3",
        }
    )

    features = [
        c
        for c in numeric_features(cur, excluded)
        if (
            c.endswith("_mean")
            or c
            in {
                "prior_stress",
                "prior_stress_2",
                "prior_stress_roll3",
            }
        )
    ]

    X = cur[features]
    y = cur["stress_class"]
    groups = cur["uid"]

    tr, te = next(splitter.split(X, y, groups))

    current_model = make_pipe(
        RandomForestClassifier(
            n_estimators=500,
            class_weight="balanced",
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
    )

    current_model.fit(X.iloc[tr], y.iloc[tr])

    pred = current_model.predict(X.iloc[te])

    current_labels = sorted(y.unique().tolist())

    current_cm = confusion_matrix(
        y.iloc[te],
        pred,
        labels=current_labels,
    )

    current_report = classification_report(
        y.iloc[te],
        pred,
        labels=current_labels,
        output_dict=True,
        zero_division=0,
    )

    metrics["current_stress"] = {
        "accuracy": float(
            accuracy_score(y.iloc[te], pred)
        ),
        "balanced_accuracy": float(
            balanced_accuracy_score(y.iloc[te], pred)
        ),
        "macro_f1": float(
            f1_score(
                y.iloc[te],
                pred,
                average="macro",
                zero_division=0,
            )
        ),
        "weighted_f1": float(
            f1_score(
                y.iloc[te],
                pred,
                average="weighted",
                zero_division=0,
            )
        ),
        "macro_precision": float(
            precision_score(
                y.iloc[te],
                pred,
                average="macro",
                zero_division=0,
            )
        ),
        "macro_recall": float(
            recall_score(
                y.iloc[te],
                pred,
                average="macro",
                zero_division=0,
            )
        ),
        "labels": current_labels,
        "confusion_matrix": current_cm.tolist(),
        "report": current_report,
    }

    joblib.dump(
        {
            "pipeline": current_model,
            "features": features,
        },
        MODEL_DIR / "current_stress_model.joblib",
    )

    # ============================================================
    # NEXT-DAY EARLY-WARNING MODEL
    # ============================================================

    warn = df[df["next_day_high_stress"].notna()].copy()

    excluded = {
        "uid",
        "date",
        "stress_class",
        "next_day_high_stress",
        "high_stress",
    }

    excluded.update(
        c for c in warn.columns if c.startswith("stress_level_")
    )

    excluded.add("stress_mean")

    features = numeric_features(warn, excluded)

    X = warn[features]
    y = warn["next_day_high_stress"].astype(int)
    groups = warn["uid"]

    tr, te = next(splitter.split(X, y, groups))

    warning_model = make_pipe(
        RandomForestClassifier(
            n_estimators=600,
            class_weight="balanced",
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        )
    )

    warning_model.fit(X.iloc[tr], y.iloc[tr])

    pred = warning_model.predict(X.iloc[te])
    proba = warning_model.predict_proba(X.iloc[te])[:, 1]

    warning_cm = confusion_matrix(
        y.iloc[te],
        pred,
        labels=[0, 1],
    )

    warning_report = classification_report(
        y.iloc[te],
        pred,
        labels=[0, 1],
        output_dict=True,
        zero_division=0,
    )

    metrics["early_warning"] = {
        "accuracy": float(
            accuracy_score(y.iloc[te], pred)
        ),
        "balanced_accuracy": float(
            balanced_accuracy_score(y.iloc[te], pred)
        ),
        "f1": float(
            f1_score(
                y.iloc[te],
                pred,
                zero_division=0,
            )
        ),
        "precision": float(
            precision_score(
                y.iloc[te],
                pred,
                zero_division=0,
            )
        ),
        "recall": float(
            recall_score(
                y.iloc[te],
                pred,
                zero_division=0,
            )
        ),
        "roc_auc": float(
            roc_auc_score(
                y.iloc[te],
                proba,
            )
        ),
        "labels": [0, 1],
        "confusion_matrix": warning_cm.tolist(),
        "report": warning_report,
    }

    joblib.dump(
        {
            "pipeline": warning_model,
            "features": features,
        },
        MODEL_DIR / "early_warning_model.joblib",
    )

    # ============================================================
    # FEATURE IMPORTANCE
    # ============================================================

    imp = pd.DataFrame(
        {
            "feature": features,
            "importance": warning_model.named_steps[
                "model"
            ].feature_importances_,
        }
    )

    imp.sort_values(
        "importance",
        ascending=False,
    ).to_csv(
        MODEL_DIR / "feature_importance.csv",
        index=False,
    )

    # ============================================================
    # SAVE METRICS
    # ============================================================

    (MODEL_DIR / "metrics.json").write_text(
        json.dumps(
            metrics,
            indent=2,
        )
    )

    # ============================================================
    # CONSOLE SUMMARY
    # ============================================================

    summary = {
        "current_stress": {
            "accuracy": metrics["current_stress"]["accuracy"],
            "balanced_accuracy": metrics["current_stress"][
                "balanced_accuracy"
            ],
            "macro_f1": metrics["current_stress"]["macro_f1"],
            "weighted_f1": metrics["current_stress"]["weighted_f1"],
            "macro_precision": metrics["current_stress"][
                "macro_precision"
            ],
            "macro_recall": metrics["current_stress"][
                "macro_recall"
            ],
        },
        "early_warning": {
            "accuracy": metrics["early_warning"]["accuracy"],
            "balanced_accuracy": metrics["early_warning"][
                "balanced_accuracy"
            ],
            "f1": metrics["early_warning"]["f1"],
            "precision": metrics["early_warning"]["precision"],
            "recall": metrics["early_warning"]["recall"],
            "roc_auc": metrics["early_warning"]["roc_auc"],
        },
    }

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()