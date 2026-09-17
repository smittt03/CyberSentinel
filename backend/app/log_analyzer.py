import subprocess


SUSPICIOUS_KEYWORDS = [
    "failed",
    "failure",
    "authentication",
    "denied",
    "error",
    "warning",
]


def get_recent_logs(lines: int = 50):
    result = subprocess.run(
        ["journalctl", "-n", str(lines), "--no-pager"],
        capture_output=True,
        text=True,
        check=False
    )

    logs = result.stdout.splitlines()

    events = []

    for log in logs:
        log_lower = log.lower()

        matched_keywords = [
            keyword
            for keyword in SUSPICIOUS_KEYWORDS
            if keyword in log_lower
        ]

        events.append({
            "message": log,
            "keywords": matched_keywords,
            "flagged": bool(matched_keywords)
        })

    return {
        "lines_requested": lines,
        "lines_returned": len(events),
        "events": events,
        "return_code": result.returncode,
        "error": result.stderr
    }
