from fastapi import FastAPI

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
