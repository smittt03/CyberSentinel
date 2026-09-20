import subprocess

import psutil

from app.security_checks import (
    check_disk_usage,
    check_listening_services,
    check_root_privileges,
)


def test_root_privileges_check():
    result = check_root_privileges()

    assert result["check"] == "root_privileges"
    assert result["status"] in ["pass", "warning"]
    assert "message" in result


def test_disk_usage_check():
    result = check_disk_usage()

    assert result["check"] == "disk_usage"
    assert result["status"] in ["pass", "warning"]
    assert "usage_percent" in result
    assert "free_bytes" in result


def test_disk_usage_handles_psutil_failure(monkeypatch):
    def fake_disk_usage(path):
        raise OSError("disk unavailable")

    monkeypatch.setattr(psutil, "disk_usage", fake_disk_usage)

    result = check_disk_usage()

    assert result["check"] == "disk_usage"
    assert result["status"] == "warning"
    assert result["usage_percent"] is None
    assert result["free_bytes"] is None
    assert "disk unavailable" in result["message"]


def test_listening_services_parses_valid_output(monkeypatch):
    completed = subprocess.CompletedProcess(
        args=["ss", "-tuln"],
        returncode=0,
        stdout=(
            "Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port\n"
            "tcp   LISTEN 0      128    127.0.0.1:8000 0.0.0.0:*\n"
            "udp   UNCONN 0      0      127.0.0.1:5353 0.0.0.0:*\n"
        ),
        stderr="",
    )

    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *args, **kwargs: completed,
    )

    result = check_listening_services()

    assert result["check"] == "listening_services"
    assert result["status"] == "info"
    assert result["return_code"] == 0
    assert len(result["services"]) == 2
    assert result["services"][0]["protocol"] == "tcp"
    assert result["services"][0]["state"] == "LISTEN"
    assert result["services"][0]["local_address"] == "127.0.0.1:8000"


def test_listening_services_ignores_malformed_lines(monkeypatch):
    completed = subprocess.CompletedProcess(
        args=["ss", "-tuln"],
        returncode=0,
        stdout=(
            "unexpected output\n"
            "tcp LISTEN\n"
            "tcp LISTEN 0 128 127.0.0.1:8000 0.0.0.0:*\n"
        ),
        stderr="",
    )

    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *args, **kwargs: completed,
    )

    result = check_listening_services()

    assert len(result["services"]) == 1
    assert result["services"][0]["local_address"] == "127.0.0.1:8000"


def test_listening_services_handles_missing_ss(monkeypatch):
    def fake_run(*args, **kwargs):
        raise FileNotFoundError()

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = check_listening_services()

    assert result["check"] == "listening_services"
    assert result["status"] == "warning"
    assert result["services"] == []
    assert result["return_code"] == -1
    assert "not found" in result["error"]


def test_listening_services_handles_timeout(monkeypatch):
    def fake_run(*args, **kwargs):
        raise subprocess.TimeoutExpired(
            cmd=["ss", "-tuln"],
            timeout=10,
        )

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = check_listening_services()

    assert result["check"] == "listening_services"
    assert result["status"] == "warning"
    assert result["services"] == []
    assert result["return_code"] == -1
    assert "timed out" in result["error"]


def test_listening_services_handles_execution_error(monkeypatch):
    def fake_run(*args, **kwargs):
        raise OSError("permission denied")

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = check_listening_services()

    assert result["check"] == "listening_services"
    assert result["status"] == "warning"
    assert result["services"] == []
    assert result["return_code"] == -1
    assert "permission denied" in result["error"]
