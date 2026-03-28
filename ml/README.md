# GasMitra ML Starter

This folder contains a first-pass ML pipeline for LPG fairness priority scoring.

## What is included

- Synthetic dataset generator.
- Regression model trainer for `target_priority_score`.
- FastAPI inference service to return predicted priority score and band.

## Setup

1. Create and activate a Python 3.13 virtual environment:

  py -3.13 -m venv ml/.venv
  ./ml/.venv/Scripts/Activate.ps1

2. Install dependencies:

  python -m pip install -r ml/requirements.txt

## Generate synthetic training data

python ml/data/generate_synthetic_lpg_data.py --rows 12000 --out ml/data/synthetic_lpg_training_data.csv

## Train model

python ml/train_priority_model.py --data ml/data/synthetic_lpg_training_data.csv

Artifacts are saved to:

- ml/artifacts/priority_model.joblib
- ml/artifacts/priority_model_meta.json

## Run ML API

uvicorn ml.api.main:app --host 0.0.0.0 --port 8000 --reload

## Test prediction

POST /predict/priority

Example payload:

{
  "days_since_last_booking": 22,
  "is_bpl": 1,
  "urgency": "medical",
  "crisis_level": "alert",
  "cylinders_requested": 1,
  "stock_at_distributor": 40,
  "queue_position": 14,
  "location_changes_30d": 0,
  "booking_gap_days": 20
}
