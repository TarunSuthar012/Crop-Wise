# sar_processing/worker.py
import datetime
import logging

from config import MOISTURE_DELTA_THRESHOLD, SAR_LOOKBACK_DAYS
from db import fetch_fields, insert_sar_features
from gee_client import get_sar_means
from feature_extractor import compute_deltas
from anomaly_detection import detect_moisture_anomaly, detect_flood


DELTA_DAYS = 7


def _clamp_lookback(target_date):
    """Ensure we never request data older than configured lookback."""
    floor = datetime.date.today() - datetime.timedelta(days=SAR_LOOKBACK_DAYS)
    return max(target_date, floor)


def run(today=None):
    fields = fetch_fields()
    today = today or datetime.date.today()
    delta = datetime.timedelta(days=DELTA_DAYS)

    for field in fields:
        geom = field["geometry"]
        field_id = field["id"]

        current_start = today - delta
        previous_start = _clamp_lookback(today - (2 * delta))
        previous_end = today - delta

        try:
            current = get_sar_means(geom, current_start, today)
            previous = get_sar_means(geom, previous_start, previous_end)
        except Exception as exc:  # pragma: no cover - runtime safeguard
            logging.exception("SAR fetch failed for field %s: %s", field_id, exc)
            continue

        deltas = compute_deltas(current, previous)

        record = {
            "field_id": field_id,
            "date": today,
            "vv_mean": current.get("vv_mean"),
            "vh_mean": current.get("vh_mean"),
            "vv_delta_7d": deltas["vv_delta_7d"],
            "vh_delta_7d": deltas["vh_delta_7d"],
            "moisture_anomaly": detect_moisture_anomaly(
                deltas["vv_delta_7d"], MOISTURE_DELTA_THRESHOLD
            ),
            "flood_flag": detect_flood(current.get("vv_mean"), current.get("vh_mean")),
        }

        try:
            insert_sar_features(record)
        except Exception as exc:  # pragma: no cover - runtime safeguard
            logging.exception("DB insert failed for field %s: %s", field_id, exc)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()