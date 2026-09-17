import ipaddress
import re
import subprocess


def scan_network(target: str):
    # Validate the target before running Nmap
    try:
        ipaddress.ip_address(target)
    except ValueError:
        return {
            "target": target,
            "host_up": False,
            "ports": [],
            "return_code": -1,
            "error": "Invalid IP address"
        }

    # Run Nmap safely without using a shell
    result = subprocess.run(
        ["nmap", target],
        capture_output=True,
        text=True,
        check=False
    )

    output = result.stdout

    # Check whether the target host is reachable
    host_up = "Host is up" in output

    ports = []

    # Parse Nmap port information
    for line in output.splitlines():
        match = re.match(
            r"^(\d+)/(\w+)\s+(open|closed|filtered)\s+(\S+)",
            line.strip()
        )

        if match:
            ports.append({
                "port": int(match.group(1)),
                "protocol": match.group(2),
                "state": match.group(3),
                "service": match.group(4)
            })

    return {
        "target": target,
        "host_up": host_up,
        "ports": ports,
        "return_code": result.returncode,
        "error": result.stderr
    }
