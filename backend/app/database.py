import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent.parent / "cybersentinel.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


def save_alert(alert):
    connection = get_connection()

    cursor = connection.execute(
        """
        INSERT INTO alerts (
            severity,
            type,
            source,
            message
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            alert.get("severity"),
            alert.get("type"),
            alert.get("source"),
            alert.get("message"),
        )
    )

    connection.commit()

    alert_id = cursor.lastrowid

    connection.close()

    return alert_id
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
