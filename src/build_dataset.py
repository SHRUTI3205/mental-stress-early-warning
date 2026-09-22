"""Build a daily StudentLife modeling table from the Kaggle ZIP.

Reference implementation follows the uploaded college project: stress is the target,
EMA responses are aggregated by participant/day, and the resulting table can feed a
FastAPI/React dashboard.  Sensor-event aggregation is intentionally optional because
several sensor files are very large.
"""
from pathlib import Path
import json, zipfile, shutil
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW_ZIP = ROOT / "data" / "raw" / "studentlife_kaggle.zip"
EXTRACT = ROOT / "data" / "raw" / "studentlife_extracted"
OUT = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

EMA_CATEGORIES = {
    "Stress": ["level"],
    "Sleep": ["hour", "rate", "social"],
    "Activity": ["working", "relaxing", "other_working", "other_relaxing"],
    "Exercise": ["exercise", "have", "schedule", "walk"],
    "Behavior": ["anxious", "calm", "enthusiastic", "critical", "dependable",
                 "disorganized", "experiences", "reserved", "sympathetic", "conventional"],
    "Mood": ["happy", "sad"],
    "Study Spaces": ["productivity", "noise"],
    "Events": ["positive", "negative"],
}


def ensure_extracted():
    if EXTRACT.exists() and (EXTRACT / "dataset").exists():
        return EXTRACT / "dataset"
    if not RAW_ZIP.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_ZIP}")
    if EXTRACT.exists():
        shutil.rmtree(EXTRACT)
    EXTRACT.mkdir(parents=True)
    with zipfile.ZipFile(RAW_ZIP) as z:
        z.extractall(EXTRACT)
    return EXTRACT / "dataset"


def read_ema(dataset_root, category, columns):
    folder = dataset_root / "EMA" / "response" / category
    rows = []
    for path in sorted(folder.glob("*.json")):
        uid = path.stem.split("_u")[-1]
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, list):
            continue
        for item in data:
            if not isinstance(item, dict) or "resp_time" not in item:
                continue
            ts = pd.to_datetime(item["resp_time"], unit="s", errors="coerce")
            if pd.isna(ts):
                continue
            row = {"uid": uid, "date": ts.normalize()}
            for col in columns:
                row[col] = pd.to_numeric(item.get(col), errors="coerce")
            rows.append(row)
    return pd.DataFrame(rows)


def aggregate(df, prefix):
    if df.empty:
        return pd.DataFrame(columns=["uid", "date"])
    numeric = [c for c in df.columns if c not in {"uid", "date"}]
    grouped = df.groupby(["uid", "date"])[numeric].agg(["mean", "max", "count"])
    grouped.columns = [f"{prefix}_{c}_{stat}" for c, stat in grouped.columns]
    return grouped.reset_index()


def main():
    dataset = ensure_extracted()
    daily = None
    for category, cols in EMA_CATEGORIES.items():
        frame = read_ema(dataset, category, cols)
        agg = aggregate(frame, category.lower().replace(" ", "_"))
        daily = agg if daily is None else daily.merge(agg, on=["uid", "date"], how="outer")

    daily = daily.sort_values(["uid", "date"]).reset_index(drop=True)
    # The StudentLife stress scale is: 1=A little stressed ... 3=Stressed out,
    # 4=Feeling good, 5=Feeling great. Therefore lower values indicate more stress.
    daily["stress_mean"] = daily["stress_level_mean"]
    daily["stress_class"] = pd.cut(
        daily["stress_mean"],
        bins=[-np.inf, 2.5, 3.5, np.inf],
        labels=["High", "Moderate", "Low"],
    )
    daily["high_stress"] = (daily["stress_mean"] <= 2).astype("Int64")

    # Early warning: use today's information to flag high stress on the following day.
    daily["stress_lag1"] = daily.groupby("uid")["stress_mean"].shift(0)
    daily["stress_lag2"] = daily.groupby("uid")["stress_mean"].shift(1)
    daily["stress_lag3"] = daily.groupby("uid")["stress_mean"].shift(2)
    daily["stress_roll3"] = daily.groupby("uid")["stress_mean"].transform(lambda s: s.rolling(3, min_periods=1).mean())
    daily["prior_stress"] = daily.groupby("uid")["stress_mean"].shift(1)
    daily["prior_stress_2"] = daily.groupby("uid")["stress_mean"].shift(2)
    daily["prior_stress_roll3"] = daily.groupby("uid")["stress_mean"].transform(lambda s: s.shift(1).rolling(3, min_periods=1).mean())
    daily["next_day_high_stress"] = daily.groupby("uid")["high_stress"].shift(-1)

    # Remove rows that contain no stress observation at all; they are not useful for
    # the target and would otherwise inflate the dashboard's participant-day count.
    daily = daily[daily["stress_mean"].notna()].copy()
    out = OUT / "daily_features.csv"
    daily.to_csv(out, index=False)

    summary = {
        "rows": int(len(daily)),
        "participants": int(daily.uid.nunique()),
        "stress_observations": int(daily["stress_level_count"].sum()),
        "high_stress_days": int(daily["high_stress"].sum()),
        "next_day_targets": int(daily["next_day_high_stress"].notna().sum()),
    }
    (OUT / "dataset_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
