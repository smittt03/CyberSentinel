import psutil


ACTIVE_STATUSES = {
    psutil.STATUS_RUNNING,
    psutil.STATUS_WAKING,
}


def get_processes():
    processes = []

    for process in psutil.process_iter(
        [
            "pid",
            "name",
            "cpu_percent",
            "memory_percent",
            "status",
        ]
    ):
        try:
            info = process.info

            status = str(
                info.get("status") or "unknown"
            ).lower()

            cpu_percent = float(
                info.get("cpu_percent") or 0
            )

            memory_percent = float(
                info.get("memory_percent") or 0
            )

            processes.append(
                {
                    "pid": info.get("pid"),
                    "name": info.get("name") or "unknown",
                    "cpu_percent": round(cpu_percent, 2),
                    "memory_percent": round(memory_percent, 2),
                    "status": status,
                    "is_active": status in ACTIVE_STATUSES,
                    "high_cpu": cpu_percent >= 5,
                }
            )

        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
            psutil.ZombieProcess,
        ):
            continue

    return processes
