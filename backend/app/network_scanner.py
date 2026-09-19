import ipaddress
import re
import subprocess


PORT_PATTERN = re.compile(
    r"^(\d+)/(\w+)\s+(open|closed|filtered)\s+(\S+)"
)


def validate_target(target: str):
    if not isinstance(target, str):
        return None

    target = target.strip()

    if not target:
        return None

    try:
        return str(ipaddress.ip_address(target))
    except ValueError:
        return None


def parse_nmap_output(output: str):
    ports = []

    for line in output.splitlines():
        match = PORT_PATTERN.match(line.strip())

        if not match:
            continue

        port, protocol, state, service = match.groups()

        try:
            port_number = int(port)
        except ValueError:
            continue

        ports.append(
            {
                "port": port_number,
                "protocol": protocol,
                "state": state,
                "service": service,
            }
        )

    return ports


def scan_network(target: str):
    validated_target = validate_target(target)

    if validated_target is None:
        return {
            "target": target,
            "host_up": False,
            "ports": [],
            "return_code": -1,
            "error": "Invalid IP address",
        }

    try:
        result = subprocess.run(
            ["nmap", validated_target],
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
        )

    except FileNotFoundError:
        return {
            "target": validated_target,
            "host_up": False,
            "ports": [],
            "return_code": -1,
            "error": "Nmap executable was not found",
        }

    except subprocess.TimeoutExpired:
        return {
            "target": validated_target,
            "host_up": False,
            "ports": [],
            "return_code": -1,
            "error": "Nmap scan timed out after 30 seconds",
        }

    except OSError as error:
        return {
            "target": validated_target,
            "host_up": False,
            "ports": [],
            "return_code": -1,
            "error": f"Nmap execution failed: {error}",
        }

    output = result.stdout or ""
    error = result.stderr or ""

    host_up = "Host is up" in output

    ports = parse_nmap_output(output)

    return {
        "target": validated_target,
        "host_up": host_up,
        "ports": ports,
        "return_code": result.returncode,
        "error": error.strip(),
    }
