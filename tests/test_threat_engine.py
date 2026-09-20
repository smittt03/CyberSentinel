from app.threat_engine import generate_alerts


def test_root_privilege_alert():
    results = {
        "checks": [
            {
                "check": "root_privileges",
                "status": "warning",
                "message": "Application is running with root privileges",
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["severity"] == "high"
    assert alerts[0]["type"] == "privilege"
    assert alerts[0]["source"] == "root_privileges"


def test_root_privilege_alert_uses_default_message():
    results = {
        "checks": [
            {
                "check": "root_privileges",
                "status": "warning",
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert (
        alerts[0]["message"]
        == "Application is running with root privileges"
    )


def test_disk_usage_alert():
    results = {
        "checks": [
            {
                "check": "disk_usage",
                "status": "warning",
                "usage_percent": 95,
                "message": "Test disk usage is critically high",
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["severity"] == "medium"
    assert alerts[0]["type"] == "resource"
    assert alerts[0]["source"] == "disk_usage"
    assert alerts[0]["usage_percent"] == 95


def test_disk_usage_alert_uses_default_message():
    results = {
        "checks": [
            {
                "check": "disk_usage",
                "status": "warning",
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["message"] == "Disk usage is high"
    assert alerts[0]["usage_percent"] is None


def test_listening_services_alert():
    results = {
        "checks": [
            {
                "check": "listening_services",
                "status": "info",
                "services": [
                    {
                        "protocol": "tcp",
                        "state": "LISTEN",
                        "local_address": "127.0.0.1:8000",
                    },
                    {
                        "protocol": "tcp",
                        "state": "LISTEN",
                        "local_address": "127.0.0.1:80",
                    },
                ],
            }
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["severity"] == "info"
    assert alerts[0]["type"] == "network"
    assert alerts[0]["source"] == "listening_services"
    assert alerts[0]["service_count"] == 2


def test_normal_checks_do_not_generate_alerts():
    results = {
        "checks": [
            {
                "check": "root_privileges",
                "status": "pass",
            },
            {
                "check": "disk_usage",
                "status": "pass",
                "usage_percent": 50,
            },
            {
                "check": "listening_services",
                "status": "info",
                "services": [],
            },
        ]
    }

    alerts = generate_alerts(results)

    assert alerts == []


def test_empty_security_results():
    assert generate_alerts({}) == []


def test_none_security_results():
    assert generate_alerts(None) == []


def test_invalid_checks_container():
    assert generate_alerts({"checks": None}) == []
    assert generate_alerts({"checks": "invalid"}) == []


def test_invalid_check_entries_are_ignored():
    results = {
        "checks": [
            None,
            "invalid",
            123,
            {
                "check": "root_privileges",
                "status": "warning",
            },
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 1
    assert alerts[0]["source"] == "root_privileges"


def test_invalid_services_container_is_ignored():
    results = {
        "checks": [
            {
                "check": "listening_services",
                "status": "info",
                "services": "not-a-list",
            }
        ]
    }

    assert generate_alerts(results) == []


def test_multiple_alerts_are_generated():
    results = {
        "checks": [
            {
                "check": "root_privileges",
                "status": "warning",
            },
            {
                "check": "disk_usage",
                "status": "warning",
                "usage_percent": 95,
            },
            {
                "check": "listening_services",
                "status": "info",
                "services": [{"port": 8000}],
            },
        ]
    }

    alerts = generate_alerts(results)

    assert len(alerts) == 3
    assert [alert["type"] for alert in alerts] == [
        "privilege",
        "resource",
        "network",
    ]
