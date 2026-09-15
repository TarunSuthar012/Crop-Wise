"""Seed a minimal farmer + field so the SAR worker has data to process."""

import uuid

import psycopg2

from config import DB_SSLMODE, DB_URL


def _require_db_url():
    if not DB_URL:
        raise ValueError("DATABASE_URL is not set. Configure it in the environment before seeding sample data.")


TEST_POLYGON_WKT = (
    "POLYGON((78.3 17.3, 78.31 17.3, 78.31 17.31, 78.3 17.31, 78.3 17.3))"
)


def seed_sample():
    farmer_id = uuid.uuid4()
    field_id = uuid.uuid4()

    _require_db_url()
    with psycopg2.connect(DB_URL, sslmode=DB_SSLMODE) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO farmers (id, phone, language)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
                """,
                (str(farmer_id), "9999999999", "en"),
            )

            cur.execute(
                """
                INSERT INTO fields (id, farmer_id, name, geometry, area_acres)
                VALUES (
                    %s,
                    %s,
                    %s,
                    ST_GeogFromText(%s),
                    %s
                )
                ON CONFLICT (id) DO NOTHING;
                """,
                (
                    str(field_id),
                    str(farmer_id),
                    "Test Field",
                    TEST_POLYGON_WKT,
                    1.5,
                ),
            )

    print("✓ Seeded sample farmer and field")


if __name__ == "__main__":
    seed_sample()