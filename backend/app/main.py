from fastapi import FastAPI, Query

from app.system_monitor import get_system_metrics
from app.process_monitor import get_processes
from app.network_scanner import scan_network
from app.log_analyzer import get_recent_logs
from app.security_checks import run_security_checks
from app.threat_engine import generate_alerts
from app.database import initialize_database, save_alert, get_alerts

app = FastAPI(
    title="CyberSentinel",
    description="Cybersecurity Monitoring and Threat Analysis Platform",
    version="1.0.0"
)
initialize_database()

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


@app.get("/api/logs")
def log_metrics(lines: int = 50):
    return get_recent_logs(lines)


@app.get("/api/security/checks")
def security_checks():
    return run_security_checks()


@app.get("/api/security/alerts")
def security_alerts():
    security_results = run_security_checks()
    alerts = generate_alerts(security_results)

    for alert in alerts:
        save_alert(alert)

    return {
        "alert_count": len(alerts),
        "alerts": alerts
    }
@app.get("/api/alerts")
def alert_history(limit: int = Query(default=50, ge=1, le=100)):
    return {
        "count": len(get_alerts(limit)),
        "alerts": get_alerts(limit)
    }
