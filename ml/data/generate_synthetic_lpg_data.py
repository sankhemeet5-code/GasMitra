import argparse
import csv
import random
from datetime import date, timedelta
from typing import Any

URGENCY_WEIGHTS = {
    "medical": 35,
    "bpl": 24,
    "regular": 12,
}

CRISIS_BONUS = {
    "normal": 0,
    "alert": 6,
    "emergency": 12,
}

PINCODES = ["400001", "411001", "431001", "422001", "440001", "416001"]


def priority_score(days_since_last_booking: int, is_bpl: int, urgency: str) -> int:
    day_factor = min(40, int(days_since_last_booking * 1.5))
    bpl_factor = 25 if is_bpl else 5
    urgency_factor = URGENCY_WEIGHTS[urgency]
    return min(100, day_factor + bpl_factor + urgency_factor)


def gen_row(i: int) -> dict[str, Any]:
    household_id = f"hh-{i:06d}"
    distributor_id = f"dist-{random.randint(1, 20)}"
    pincode = random.choice(PINCODES)

    urgency = random.choices(
        ["medical", "bpl", "regular"],
        weights=[0.18, 0.27, 0.55],
        k=1,
    )[0]

    if urgency == "bpl":
        is_bpl = 1 if random.random() < 0.85 else 0
    else:
        is_bpl = 1 if random.random() < 0.28 else 0

    crisis_level = random.choices(
        ["normal", "alert", "emergency"],
        weights=[0.72, 0.22, 0.06],
        k=1,
    )[0]

    days_since_last_booking = int(random.triangular(1, 90, 25))
    cylinders_requested = 1 if random.random() < 0.9 else 2
    stock_at_distributor = random.randint(8, 180)
    queue_position = random.randint(1, 120)
    location_changes_30d = random.choices([0, 1, 2, 3], weights=[0.80, 0.13, 0.05, 0.02], k=1)[0]
    booking_gap_days = max(0, days_since_last_booking - random.randint(0, 10))

    base_score = priority_score(days_since_last_booking, is_bpl, urgency)
    score_with_crisis = min(100, base_score + CRISIS_BONUS[crisis_level])
    target_priority_score = max(0.0, min(100.0, score_with_crisis + random.gauss(0, 4)))

    expected_wait_hours = (
        10
        + 0.20 * queue_position
        + 0.06 * max(0, 90 - stock_at_distributor)
        - 0.08 * target_priority_score
        + random.gauss(0, 1.5)
    )
    expected_wait_hours = max(1.0, round(expected_wait_hours, 2))

    today = date.today()
    last_booking_date = today - timedelta(days=days_since_last_booking)
    request_date = today - timedelta(days=max(0, days_since_last_booking - random.randint(0, 5)))

    return {
        "household_id": household_id,
        "distributor_id": distributor_id,
        "pincode": pincode,
        "last_booking_date": last_booking_date.isoformat(),
        "request_date": request_date.isoformat(),
        "days_since_last_booking": days_since_last_booking,
        "is_bpl": is_bpl,
        "urgency": urgency,
        "crisis_level": crisis_level,
        "cylinders_requested": cylinders_requested,
        "stock_at_distributor": stock_at_distributor,
        "queue_position": queue_position,
        "location_changes_30d": location_changes_30d,
        "booking_gap_days": booking_gap_days,
        "target_priority_score": round(target_priority_score, 2),
        "target_expected_wait_hours": expected_wait_hours,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic LPG booking training CSV")
    parser.add_argument("--rows", type=int, default=12000, help="Number of synthetic rows")
    parser.add_argument(
        "--out",
        type=str,
        default="ml/data/synthetic_lpg_training_data.csv",
        help="Output CSV path",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    random.seed(args.seed)

    fieldnames = [
        "household_id",
        "distributor_id",
        "pincode",
        "last_booking_date",
        "request_date",
        "days_since_last_booking",
        "is_bpl",
        "urgency",
        "crisis_level",
        "cylinders_requested",
        "stock_at_distributor",
        "queue_position",
        "location_changes_30d",
        "booking_gap_days",
        "target_priority_score",
        "target_expected_wait_hours",
    ]

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(1, args.rows + 1):
            writer.writerow(gen_row(i))

    print(f"Generated {args.rows} rows at {args.out}")


if __name__ == "__main__":
    main()
