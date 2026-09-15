import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from config import DB_SSLMODE, DB_URL


def _require_db_url():
    if not DB_URL:
        raise ValueError("DATABASE_URL is not set. Configure it in the environment before bootstrapping the DB.")


def get_conn():
    _require_db_url()
    conn = psycopg2.connect(DB_URL, sslmode=DB_SSLMODE)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    return conn


def enable_extensions(cur):
    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    print("✓ PostGIS + pgcrypto enabled")


def create_farmers(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS farmers (
            id UUID PRIMARY KEY,
            phone TEXT UNIQUE NOT NULL,
            language TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ farmers table")


def create_fields(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS fields (
            id UUID PRIMARY KEY,
            farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
            name TEXT,
            geometry GEOGRAPHY(POLYGON),
            area_acres FLOAT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ fields table")


def create_sar_features(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sar_features (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
            date DATE NOT NULL,

            vv_mean FLOAT,
            vh_mean FLOAT,
            vv_delta_7d FLOAT,
            vh_delta_7d FLOAT,

            moisture_anomaly TEXT CHECK (moisture_anomaly IN ('low', 'normal', 'high')),
            flood_flag BOOLEAN DEFAULT FALSE,

            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(field_id, date)
        );
    """)
    print("✓ sar_features table")


def create_ml_insights(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ml_insights (
            id UUID PRIMARY KEY,
            field_id UUID REFERENCES fields(id) ON DELETE CASCADE,

            type TEXT NOT NULL,
            payload JSONB NOT NULL,
            confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),

            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ ml_insights table")


def create_schedule_tasks(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS schedule_tasks (
            id UUID PRIMARY KEY,
            field_id UUID REFERENCES fields(id) ON DELETE CASCADE,

            task_type TEXT NOT NULL,
            window_start DATE,
            window_end DATE,

            status TEXT CHECK (
                status IN ('pending', 'completed', 'cancelled', 'escalated')
            ) DEFAULT 'pending',

            reason TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ schedule_tasks table")


def create_risk_states(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS risk_states (
            field_id UUID PRIMARY KEY REFERENCES fields(id) ON DELETE CASCADE,

            state TEXT CHECK (state IN ('green', 'yellow', 'red')),
            dominant_risk TEXT,
            loss_estimate FLOAT,

            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ risk_states table")


def create_alerts(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id UUID PRIMARY KEY,
            field_id UUID REFERENCES fields(id) ON DELETE CASCADE,

            message TEXT NOT NULL,
            severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
            delivered BOOLEAN DEFAULT FALSE,

            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    print("✓ alerts table")


def main():
    conn = get_conn()
    cur = conn.cursor()

    print("🔧 Bootstrapping database schema...\n")

    enable_extensions(cur)

    create_farmers(cur)
    create_fields(cur)
    create_sar_features(cur)
    create_ml_insights(cur)
    create_schedule_tasks(cur)
    create_risk_states(cur)
    create_alerts(cur)

    cur.close()
    conn.close()

    print("\n✅ Database schema verified and ready.")


if __name__ == "__main__":
    main()