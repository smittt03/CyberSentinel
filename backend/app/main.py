from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.system_monitor import get_system_metrics
from app.process_monitor import get_processes
from app.network_scanner import scan_network
from app.log_analyzer import get_recent_logs
from app.security_checks import run_security_checks
from app.threat_engine import generate_alerts
from app.database import (
    initialize_database,
    save_alert,
    get_alerts,
    get_active_alerts,
    resolve_missing_alerts,
)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="CyberSentinel",
    description="Cybersecurity Monitoring and Threat Analysis Platform",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

initialize_database()


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "project": "CyberSentinel",
        "status": "online",
        "message": "Cybersecurity monitoring platform is running"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =========================================================
# SYSTEM MONITOR
# =========================================================

@app.get("/api/system")
def system_metrics():

    return get_system_metrics()


# =========================================================
# PROCESS MONITOR
# =========================================================

@app.get("/api/processes")
def process_metrics():

    return get_processes()


# =========================================================
# NETWORK SCANNER
# =========================================================

@app.get("/api/network/scan")
def network_scan(target: str):

    return scan_network(target)


# =========================================================
# LOG ANALYZER
# =========================================================

@app.get("/api/logs")
def log_metrics(lines: int = 50):

    return get_recent_logs(lines)


# =========================================================
# SECURITY CHECKS
# =========================================================

@app.get("/api/security/checks")
def security_checks():

    return run_security_checks()


# =========================================================
# SECURITY ALERT ENGINE
# =========================================================

@app.get("/api/security/alerts")
def security_alerts():

    # -----------------------------------------------------
    # Run current security checks
    # -----------------------------------------------------

    security_results = run_security_checks()


    # -----------------------------------------------------
    # Generate alerts from current results
    # -----------------------------------------------------

    alerts = generate_alerts(
        security_results
    )


    # -----------------------------------------------------
    # Save only new active alert events
    # -----------------------------------------------------

    for alert in alerts:

        save_alert(alert)


    # -----------------------------------------------------
    # Resolve alerts that are no longer detected
    # -----------------------------------------------------

    resolve_missing_alerts(
        alerts
    )


    # -----------------------------------------------------
    # Return current active alerts
    # -----------------------------------------------------

    active_alerts = get_active_alerts()


    return {
        "alert_count": len(active_alerts),
        "alerts": active_alerts
    }


# =========================================================
# ALERT HISTORY
# =========================================================

@app.get("/api/alerts")
def alert_history(
    limit: int = Query(
        default=50,
        ge=1,
        le=100
    )
):

    alerts = get_alerts(limit)

    return {
        "count": len(alerts),
        "alerts": alerts
    }
