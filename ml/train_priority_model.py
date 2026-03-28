import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

FEATURE_COLUMNS = [
    "days_since_last_booking",
    "is_bpl",
    "urgency",
    "crisis_level",
    "cylinders_requested",
    "stock_at_distributor",
    "queue_position",
    "location_changes_30d",
    "booking_gap_days",
]

CAT_COLUMNS = ["urgency", "crisis_level"]
NUM_COLUMNS = [col for col in FEATURE_COLUMNS if col not in CAT_COLUMNS]


def train(data_path: str, target_col: str, model_path: str, metadata_path: str) -> dict[str, float]:
    df = pd.read_csv(data_path)

    required = set(FEATURE_COLUMNS + [target_col])
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    x = df[FEATURE_COLUMNS]
    y = df[target_col].astype(float)

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CAT_COLUMNS),
            ("num", "passthrough", NUM_COLUMNS),
        ]
    )

    regressor = RandomForestRegressor(
        n_estimators=260,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ]
    )

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
    )

    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)

    mae = float(mean_absolute_error(y_test, predictions))
    rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
    r2 = float(r2_score(y_test, predictions))

    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    Path(metadata_path).parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, model_path)

    metadata = {
        "target": target_col,
        "features": FEATURE_COLUMNS,
        "categorical_features": CAT_COLUMNS,
        "numerical_features": NUM_COLUMNS,
        "metrics": {"mae": mae, "rmse": rmse, "r2": r2},
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata["metrics"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Train LPG priority regression model")
    parser.add_argument("--data", type=str, default="ml/data/synthetic_lpg_training_data.csv")
    parser.add_argument("--target", type=str, default="target_priority_score")
    parser.add_argument("--model-out", type=str, default="ml/artifacts/priority_model.joblib")
    parser.add_argument("--meta-out", type=str, default="ml/artifacts/priority_model_meta.json")
    args = parser.parse_args()

    metrics = train(
        data_path=args.data,
        target_col=args.target,
        model_path=args.model_out,
        metadata_path=args.meta_out,
    )

    print("Training complete")
    print(f"MAE: {metrics['mae']:.4f}")
    print(f"RMSE: {metrics['rmse']:.4f}")
    print(f"R2: {metrics['r2']:.4f}")


if __name__ == "__main__":
    main()
