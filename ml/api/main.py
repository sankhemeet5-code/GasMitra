from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

MODEL_PATH = Path("ml/artifacts/priority_model.joblib")

app = FastAPI(title="GasMitra ML Service", version="0.1.0")


class PriorityRequest(BaseModel):
    days_since_last_booking: int = Field(ge=0, le=365)
    is_bpl: int = Field(ge=0, le=1)
    urgency: str
    crisis_level: str
    cylinders_requested: int = Field(ge=1, le=3)
    stock_at_distributor: int = Field(ge=0, le=2000)
    queue_position: int = Field(ge=1, le=10000)
    location_changes_30d: int = Field(ge=0, le=50)
    booking_gap_days: int = Field(ge=0, le=365)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict/priority")
def predict_priority(payload: PriorityRequest) -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Model not found. Train first with ml/train_priority_model.py",
        )

    model = joblib.load(MODEL_PATH)
    row = {
        "days_since_last_booking": payload.days_since_last_booking,
        "is_bpl": payload.is_bpl,
        "urgency": payload.urgency,
        "crisis_level": payload.crisis_level,
        "cylinders_requested": payload.cylinders_requested,
        "stock_at_distributor": payload.stock_at_distributor,
        "queue_position": payload.queue_position,
        "location_changes_30d": payload.location_changes_30d,
        "booking_gap_days": payload.booking_gap_days,
    }

    pred = float(model.predict(pd.DataFrame([row]))[0])
    bounded_score = max(0.0, min(100.0, round(pred, 2)))

    if bounded_score > 70:
        band = "high"
    elif bounded_score >= 40:
        band = "medium"
    else:
        band = "low"

    return {
        "predicted_priority_score": bounded_score,
        "priority_band": band,
    }
