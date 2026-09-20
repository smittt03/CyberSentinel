import sqlite3

import app.database as database


def setup_test_database(monkeypatch, tmp_path):
    database_path = tmp_path / "test_cybersentinel.db"
    monkeypatch.setattr(database, "DATABASE_PATH", database_path)
    database.initialize_database()
    return database_path


def test_initialize_database_creates_alert_table(monkeypatch, tmp_path):
    database_path = setup_test_database(monkeypatch, tmp_path)

    connection = sqlite3.connect(database_path)

    row = connection.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'alerts'
        """
    ).fetchone()

    connection.close()

    assert row is not None
    assert row[0] == "alerts"


def test_save_alert_creates_new_alert(monkeypatch, tmp_path):
    setup_test_database(monkeypatch, tmp_path)

    alert = {
        "severity": "high",
        "type": "privilege",
        "source": "root_privileges",
        "message": "Application is running with root privileges",
    }

    alert_id = database.save_alert(alert)

    assert isinstance(alert_id, int)
    assert alert_id > 0

    alerts = database.get_active_alerts()

    assert len(alerts) == 1
    assert alerts[0]["id"] == alert_id
    assert alerts[0]["status"] == "active"


def test_save_alert_deduplicates_active_alert(monkeypatch, tmp_path):
    setup_test_database(monkeypatch, tmp_path)

    alert = {
        "severity": "info",
        "type": "network",
        "source": "listening_services",
        "message": "Listening network services detected",
    }

    first_id = database.save_alert(alert)
    second_id = database.save_alert(alert)

    assert first_id == second_id

    alerts = database.get_active_alerts()

    assert len(alerts) == 1


def test_resolve_missing_alerts(monkeypatch, tmp_path):
    setup_test_database(monkeypatch, tmp_path)

    alert = {
        "severity": "medium",
        "type": "resource",
        "source": "disk_usage",
        "message": "Disk usage is high",
    }

    alert_id = database.save_alert(alert)

    database.resolve_missing_alerts([])

    alerts = database.get_alerts()

    assert len(alerts) == 1
    assert alerts[0]["id"] == alert_id
    assert alerts[0]["status"] == "resolved"
    assert alerts[0]["resolved_at"] is not None


def test_resolve_missing_alerts_keeps_current_alerts_active(
    monkeypatch,
    tmp_path,
):
    setup_test_database(monkeypatch, tmp_path)

    alert = {
        "severity": "medium",
        "type": "resource",
        "source": "disk_usage",
        "message": "Disk usage is high",
    }

    alert_id = database.save_alert(alert)

    database.resolve_missing_alerts([alert])

    alerts = database.get_active_alerts()

    assert len(alerts) == 1
    assert alerts[0]["id"] == alert_id
    assert alerts[0]["status"] == "active"
    assert alerts[0]["resolved_at"] is None


def test_resolved_alert_can_be_created_again_as_new_event(
    monkeypatch,
    tmp_path,
):
    setup_test_database(monkeypatch, tmp_path)

    alert = {
        "severity": "high",
        "type": "privilege",
        "source": "root_privileges",
        "message": "Application is running with root privileges",
    }

    first_id = database.save_alert(alert)

    database.resolve_missing_alerts([])

    second_id = database.save_alert(alert)

    assert second_id != first_id

    alerts = database.get_alerts()

    assert len(alerts) == 2
    assert alerts[0]["status"] == "active"
    assert alerts[1]["status"] == "resolved"


def test_get_alerts_respects_limit(monkeypatch, tmp_path):
    setup_test_database(monkeypatch, tmp_path)

    for index in range(5):
        database.save_alert(
            {
                "severity": "info",
                "type": "network",
                "source": f"source_{index}",
                "message": f"Alert {index}",
            }
        )

    alerts = database.get_alerts(3)

    assert len(alerts) == 3


def test_get_active_alerts_returns_only_active_alerts(
    monkeypatch,
    tmp_path,
):
    setup_test_database(monkeypatch, tmp_path)

    active_alert = {
        "severity": "info",
        "type": "network",
        "source": "active_source",
        "message": "Active alert",
    }

    resolved_alert = {
        "severity": "medium",
        "type": "resource",
        "source": "resolved_source",
        "message": "Resolved alert",
    }

    database.save_alert(active_alert)
    database.save_alert(resolved_alert)
    database.resolve_missing_alerts([active_alert])

    alerts = database.get_active_alerts()

    assert len(alerts) == 1
    assert alerts[0]["source"] == "active_source"
