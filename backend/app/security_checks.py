import os
import subprocess


def check_root_privileges():
    is_root = os.geteuid() == 0

    if is_root:
        return {
            "check": "root_privileges",
            "status": "warning",
            "message": "Application is running with root privileges"
        }

    return {
        "check": "root_privileges",
        "status": "pass",
        "message": "Application is running as a non-root user"
    }


def check_listening_services():
    result = subprocess.run(
        ["ss", "-tuln"],
        capture_output=True,
        text=True,
        check=False
    )

    services = []

    for line in result.stdout.splitlines():
        parts = line.split()

        if len(parts) < 5:
            continue

        protocol = parts[0]
        state = parts[1]
        local_address = parts[4]

        if state != "LISTEN" and protocol not in ("udp", "udp6"):
            continue

        services.append({
            "protocol": protocol,
            "state": state,
            "local_address": local_address
        })

    return {
        "check": "listening_services",
        "status": "info",
        "services": services,
        "return_code": result.returncode,
        "error": result.stderr
    }
def run_security_checks():
    return {
        "checks": [
            check_root_privileges(),
            check_listening_services(),
            check_disk_usage()
        ]
    }
def check_disk_usage():
    import psutil

    disk = psutil.disk_usage("/")

    if disk.percent >= 90:
        status = "warning"
        message = "Disk usage is critically high"
    elif disk.percent >= 80:
        status = "warning"
        message = "Disk usage is high"
    else:
        status = "pass"
        message = "Disk usage is within normal range"

    return {
        "check": "disk_usage",
        "status": status,
        "usage_percent": disk.percent,
        "free_bytes": disk.free,
        "message": message
    }
