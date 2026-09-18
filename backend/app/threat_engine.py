def generate_alerts(security_results):
    alerts = []

    for check in security_results.get("checks", []):
        check_name = check.get("check")
        status = check.get("status")

        if check_name == "root_privileges" and status == "warning":
            alerts.append({
                "severity": "high",
                "type": "privilege",
                "source": check_name,
                "message": check.get(
                    "message",
                    "Application is running with root privileges"
                )
            })

        elif check_name == "disk_usage" and status == "warning":
            alerts.append({
                "severity": "medium",
                "type": "resource",
                "source": check_name,
                "message": check.get(
                    "message",
                    "Disk usage is high"
                ),
                "usage_percent": check.get("usage_percent")
            })

        elif check_name == "listening_services":
            services = check.get("services", [])

            if services:
                alerts.append({
                    "severity": "info",
                    "type": "network",
                    "source": check_name,
                    "message": "Listening network services detected",
                    "service_count": len(services)
                })

    return alerts
