import subprocess

from app.log_analyzer import (
    analyze_log_line,
    get_recent_logs,
    validate_line_count,
)


def test_validate_line_count():
    assert validate_line_count(50) == 50


def test_validate_line_count_rejects_zero():
    assert validate_line_count(0) is None


def test_validate_line_count_rejects_negative():
    assert validate_line_count(-10) is None


def test_validate_line_count_rejects_invalid_value():
    assert validate_line_count("invalid") is None


def test_validate_line_count_caps_large_value():
    assert validate_line_count(5000) == 1000


def test_analyze_log_line_flags_suspicious_keywords():
    result = analyze_log_line(
        "Failed authentication attempt detected"
    )

    assert result["flagged"] is True
    assert "failed" in result["keywords"]
    assert "authentication" in result["keywords"]


def test_analyze_log_line_allows_normal_message():
    result = analyze_log_line(
        "System service started successfully"
    )

    assert result["flagged"] is False
    assert result["keywords"] == []


def test_get_recent_logs_success(monkeypatch):
    completed = subprocess.CompletedProcess(
        args=[
            "journalctl",
            "-n",
            "50",
            "--no-pager",
        ],
        returncode=0,
        stdout=(
            "System service started\n"
            "Failed authentication attempt\n"
            "Network service ready\n"
        ),
        stderr="",
    )

    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *args, **kwargs: completed,
    )

    result = get_recent_logs(50)

    assert result["lines_requested"] == 50
    assert result["lines_returned"] == 3
    assert result["return_code"] == 0
    assert result["error"] == ""
    assert len(result["events"]) == 3
    assert result["events"][1]["flagged"] is True


def test_get_recent_logs_invalid_lines():
    result = get_recent_logs(0)

    assert result["lines_returned"] == 0
    assert result["events"] == []
    assert result["return_code"] == -1
    assert "Invalid line count" in result["error"]


def test_get_recent_logs_caps_large_request(monkeypatch):
    completed = subprocess.CompletedProcess(
        args=[
            "journalctl",
            "-n",
            "1000",
            "--no-pager",
        ],
        returncode=0,
        stdout="Test log entry\n",
        stderr="",
    )

    def fake_run(command, **kwargs):
        assert command == [
            "journalctl",
            "-n",
            "1000",
            "--no-pager",
        ]
        return completed

    monkeypatch.setattr(
        subprocess,
        "run",
        fake_run,
    )

    result = get_recent_logs(5000)

    assert result["lines_requested"] == 1000
    assert result["return_code"] == 0


def test_get_recent_logs_handles_missing_journalctl(monkeypatch):
    def fake_run(*args, **kwargs):
        raise FileNotFoundError()

    monkeypatch.setattr(
        subprocess,
        "run",
        fake_run,
    )

    result = get_recent_logs(50)

    assert result["lines_returned"] == 0
    assert result["events"] == []
    assert result["return_code"] == -1
    assert "not found" in result["error"]


def test_get_recent_logs_handles_timeout(monkeypatch):
    def fake_run(*args, **kwargs):
        raise subprocess.TimeoutExpired(
            cmd=[
                "journalctl",
                "-n",
                "50",
                "--no-pager",
            ],
            timeout=10,
        )

    monkeypatch.setattr(
        subprocess,
        "run",
        fake_run,
    )

    result = get_recent_logs(50)

    assert result["lines_returned"] == 0
    assert result["events"] == []
    assert result["return_code"] == -1
    assert "timed out" in result["error"]


def test_get_recent_logs_handles_execution_error(monkeypatch):
    def fake_run(*args, **kwargs):
        raise OSError("permission denied")

    monkeypatch.setattr(
        subprocess,
        "run",
        fake_run,
    )

    result = get_recent_logs(50)

    assert result["lines_returned"] == 0
    assert result["events"] == []
    assert result["return_code"] == -1
    assert "execution failed" in result["error"]
