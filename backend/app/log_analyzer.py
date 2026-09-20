import subprocess


SUSPICIOUS_KEYWORDS = [
    "failed",
    "failure",
    "authentication",
    "denied",
    "error",
    "warning",
]

DEFAULT_LINES = 50
MAX_LINES = 1000
COMMAND_TIMEOUT = 10


def validate_line_count(lines):
    try:
        lines = int(lines)
    except (TypeError, ValueError):
        return None

    if lines < 1:
        return None

    if lines > MAX_LINES:
        return MAX_LINES

    return lines


def analyze_log_line(log):
    log_lower = log.lower()

    matched_keywords = [
        keyword
        for keyword in SUSPICIOUS_KEYWORDS
        if keyword in log_lower
    ]

    return {
        "message": log,
        "keywords": matched_keywords,
        "flagged": bool(matched_keywords),
    }


def get_recent_logs(lines: int = DEFAULT_LINES):
    validated_lines = validate_line_count(lines)

    if validated_lines is None:
        return {
            "lines_requested": lines,
            "lines_returned": 0,
            "events": [],
            "return_code": -1,
            "error": (
                f"Invalid line count. "
                f"Use a value between 1 and {MAX_LINES}."
            ),
        }

    try:
        result = subprocess.run(
            [
                "journalctl",
                "-n",
                str(validated_lines),
                "--no-pager",
            ],
            capture_output=True,
            text=True,
            check=False,
            timeout=COMMAND_TIMEOUT,
        )

    except FileNotFoundError:
        return {
            "lines_requested": validated_lines,
            "lines_returned": 0,
            "events": [],
            "return_code": -1,
            "error": "journalctl executable was not found",
        }

    except subprocess.TimeoutExpired:
        return {
            "lines_requested": validated_lines,
            "lines_returned": 0,
            "events": [],
            "return_code": -1,
            "error": (
                f"journalctl command timed out "
                f"after {COMMAND_TIMEOUT} seconds"
            ),
        }

    except OSError as error:
        return {
            "lines_requested": validated_lines,
            "lines_returned": 0,
            "events": [],
            "return_code": -1,
            "error": f"journalctl execution failed: {error}",
        }

    logs = (result.stdout or "").splitlines()

    events = [
        analyze_log_line(log)
        for log in logs
    ]

    return {
        "lines_requested": validated_lines,
        "lines_returned": len(events),
        "events": events,
        "return_code": result.returncode,
        "error": (result.stderr or "").strip(),
    }
