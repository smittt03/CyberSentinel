import sqlite3
from pathlib import Path


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DATABASE_PATH = (
    Path(__file__).resolve().parent.parent / "cybersentinel.db"
)


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

def initialize_database():

    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            severity TEXT NOT NULL,
            type TEXT NOT NULL,
            source TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


# =========================================================
# SAVE OR REACTIVATE ALERT
# =========================================================

def save_alert(alert):

    connection = get_connection()

    severity = alert.get("severity")
    alert_type = alert.get("type")
    source = alert.get("source")
    message = alert.get("message")

    # -----------------------------------------------------
    # Check whether the same alert is already active
    # -----------------------------------------------------

    existing = connection.execute(
        """
        SELECT id
        FROM alerts
        WHERE severity = ?
          AND type = ?
          AND source = ?
          AND message = ?
          AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
        """,
        (
            severity,
            alert_type,
            source,
            message,
        )
    ).fetchone()

    # -----------------------------------------------------
    # Already active
    # -----------------------------------------------------

    if existing:

        connection.close()

        return existing["id"]


    # -----------------------------------------------------
    # Create a new alert event
    # -----------------------------------------------------

    cursor = connection.execute(
        """
        INSERT INTO alerts (
            severity,
            type,
            source,
            message,
            status
        )
        VALUES (?, ?, ?, ?, 'active')
        """,
        (
            severity,
            alert_type,
            source,
            message,
        )
    )

    connection.commit()

    alert_id = cursor.lastrowid

    connection.close()

    return alert_id


# =========================================================
# RESOLVE ALERTS THAT ARE NO LONGER DETECTED
# =========================================================

def resolve_missing_alerts(active_alerts):

    connection = get_connection()

    # Create signatures for currently active alerts.
    active_signatures = set()

    for alert in active_alerts:

        signature = (
            alert.get("severity"),
            alert.get("type"),
            alert.get("source"),
            alert.get("message"),
        )

        active_signatures.add(signature)


    # -----------------------------------------------------
    # Retrieve currently active database alerts
    # -----------------------------------------------------

    rows = connection.execute(
        """
        SELECT
            id,
            severity,
            type,
            source,
            message
        FROM alerts
        WHERE status = 'active'
        """
    ).fetchall()


    # -----------------------------------------------------
    # Resolve alerts no longer detected
    # -----------------------------------------------------

    for row in rows:

        signature = (
            row["severity"],
            row["type"],
            row["source"],
            row["message"],
        )

        if signature not in active_signatures:

            connection.execute(
                """
                UPDATE alerts
                SET
                    status = 'resolved',
                    resolved_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (row["id"],)
            )


    connection.commit()
    connection.close()


# =========================================================
# GET ALERT HISTORY
# =========================================================

def get_alerts(limit=50):

    connection = get_connection()

    rows = connection.execute(
        """
        SELECT *
        FROM alerts
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,)
    ).fetchall()

    connection.close()

    return [dict(row) for row in rows]


# =========================================================
# GET ACTIVE ALERTS
# =========================================================

def get_active_alerts():

    connection = get_connection()

    rows = connection.execute(
        """
        SELECT *
        FROM alerts
        WHERE status = 'active'
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    return [dict(row) for row in rows]
