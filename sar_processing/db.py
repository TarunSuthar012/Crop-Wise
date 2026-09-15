# sar_processing/db.py

import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_SSLMODE, DB_URL


def _require_db_url():
    if not DB_URL:
        raise ValueError("DATABASE_URL is not set. Configure it in the environment before running SAR processing.")

def get_connection():
    _require_db_url()
    return psycopg2.connect(DB_URL, sslmode=DB_SSLMODE)

def fetch_fields():
    """Fetch field_id and geometry"""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, ST_AsGeoJSON(geometry) AS geometry
                FROM fields
            """)
            return cur.fetchall()

def insert_sar_features(record):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sar_features (
                    field_id, date,
                    vv_mean, vh_mean,
                    vv_delta_7d, vh_delta_7d,
                    moisture_anomaly, flood_flag
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (field_id, date) DO NOTHING
            """, (
                record["field_id"],
                record["date"],
                record["vv_mean"],
                record["vh_mean"],
                record["vv_delta_7d"],
                record["vh_delta_7d"],
                record["moisture_anomaly"],
                record["flood_flag"]
            ))