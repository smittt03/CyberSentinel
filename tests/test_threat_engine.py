from app.threat_engine import generate_alerts


def test_root_privilege_alert():
    results = {
        "checks": [
            {
                "check": "root_privileges",
                "status": "warning",
                "message": "Application is running with root privileges"
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["severity"] == "high"
    assert alerts[0]["type"] == "privilege"
    assert alerts[0]["source"] == "root_privileges"


def test_disk_usage_alert():
    results = {
        "checks": [
            {
                "check": "disk_usage",
                "status": "warning",
                "usage_percent": 95,
                "message": "Test disk usage is critically high"
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["severity"] == "medium"
    assert alerts[0]["type"] == "resource"
    assert alerts[0]["source"] == "disk_usage"
