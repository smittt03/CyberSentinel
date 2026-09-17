from fastapi import FastAPI

from app.system_monitor import get_system_metrics
from app.process_monitor import get_processes
from app.network_scanner import scan_network



app = FastAPI(
    title="CyberSentinel",
    description="Cybersecurity Monitoring and Threat Analysis Platform",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "project": "CyberSentinel",
        "status": "online",
        "message": "Cybersecurity monitoring platform is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/api/system")
def system_metrics():
    return get_system_metrics()

@app.get("/api/processes")
def process_metrics():
    return get_processes()

@app.get("/api/network/scan")
def network_scan(target: str):
    return scan_network(target)

