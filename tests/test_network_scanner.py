import subprocess

from app.network_scanner import (
    parse_nmap_output,
    scan_network,
    validate_target,
)


def test_validate_ipv4_target():
    assert validate_target("127.0.0.1") == "127.0.0.1"


def test_validate_ipv6_target():
    assert validate_target("::1") == "::1"


def test_validate_target_strips_whitespace():
    assert validate_target(" 127.0.0.1 ") == "127.0.0.1"


def test_validate_invalid_target():
    assert validate_target("not-an-ip") is None


def test_validate_empty_target():
    assert validate_target("") is None


def test_parse_nmap_output():
    output = """
Nmap scan report for 127.0.0.1
Host is up (0.00012s latency).

PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  closed https
"""

    ports = parse_nmap_output(output)

    assert len(ports) == 3
    assert ports[0] == {
        "port": 22,
        "protocol": "tcp",
        "state": "open",
        "service": "ssh",
    }
    assert ports[1]["port"] == 80
    assert ports[1]["service"] == "http"
    assert ports[2]["state"] == "closed"


def test_parse_ignores_unrelated_lines():
    output = """
Nmap scan report for 127.0.0.1
Host is up.

PORT     STATE SERVICE
80/tcp   open  http

Random unexpected output
Not a port line
"""

    ports = parse_nmap_output(output)

    assert len(ports) == 1
    assert ports[0]["port"] == 80


def test_scan_invalid_target_does_not_run_nmap(monkeypatch):
    def fake_run(*args, **kwargs):
        raise AssertionError("Nmap should not run for invalid targets")

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = scan_network("invalid-target")

    assert result["host_up"] is False
    assert result["ports"] == []
    assert result["return_code"] == -1
    assert result["error"] == "Invalid IP address"


def test_scan_success(monkeypatch):
    completed = subprocess.CompletedProcess(
        args=["nmap", "127.0.0.1"],
        returncode=0,
        stdout="""
Nmap scan report for 127.0.0.1
Host is up.

PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
""",
        stderr="",
    )

    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *args, **kwargs: completed,
    )

    result = scan_network("127.0.0.1")

    assert result["target"] == "127.0.0.1"
    assert result["host_up"] is True
    assert result["return_code"] == 0
    assert len(result["ports"]) == 2


def test_scan_handles_missing_nmap(monkeypatch):
    def fake_run(*args, **kwargs):
        raise FileNotFoundError()

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = scan_network("127.0.0.1")

    assert result["host_up"] is False
    assert result["ports"] == []
    assert result["return_code"] == -1
    assert "not found" in result["error"]


def test_scan_handles_timeout(monkeypatch):
    def fake_run(*args, **kwargs):
        raise subprocess.TimeoutExpired(
            cmd=["nmap", "127.0.0.1"],
            timeout=30,
        )

    monkeypatch.setattr(subprocess, "run", fake_run)

    result = scan_network("127.0.0.1")

    assert result["host_up"] is False
    assert result["ports"] == []
    assert result["return_code"] == -1
    assert "timed out" in result["error"]
