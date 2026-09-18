import { useEffect, useState } from "react";
import "./App.css";


// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE = "http://127.0.0.1:8000";


// =========================================================
// APP
// =========================================================

function App() {

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [system, setSystem] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(null);


  // -------------------------------------------------------
  // FETCH SYSTEM METRICS
  // -------------------------------------------------------

  const fetchSystemData = async () => {

    try {

      const response = await fetch(
        `${API_BASE}/api/system`
      );

      if (!response.ok) {
        throw new Error("System API request failed");
      }

      const data = await response.json();

      setSystem(data);
      setBackendOnline(true);

    } catch (error) {

      console.error(
        "System API error:",
        error
      );

      setBackendOnline(false);
    }
  };


  // -------------------------------------------------------
  // FETCH ACTIVE SECURITY ALERTS
  // -------------------------------------------------------

  const fetchSecurityAlerts = async () => {

    try {

      const response = await fetch(
        `${API_BASE}/api/security/alerts`
      );

      if (!response.ok) {
        throw new Error("Security alert API request failed");
      }

      const data = await response.json();

      setAlerts(
        data.alerts || []
      );

    } catch (error) {

      console.error(
        "Security alert API error:",
        error
      );
    }
  };


  // -------------------------------------------------------
  // FETCH ALERT HISTORY
  // -------------------------------------------------------

  const fetchAlertHistory = async () => {

    try {

      const response = await fetch(
        `${API_BASE}/api/alerts?limit=10`
      );

      if (!response.ok) {
        throw new Error("Alert history API request failed");
      }

      const data = await response.json();

      setAlertHistory(
        data.alerts || []
      );

    } catch (error) {

      console.error(
        "Alert history API error:",
        error
      );
    }
  };


  // -------------------------------------------------------
  // REFRESH DASHBOARD
  // -------------------------------------------------------

  const refreshDashboard = async () => {

    setLoading(true);

    await Promise.all([
      fetchSystemData(),
      fetchSecurityAlerts(),
      fetchAlertHistory()
    ]);

    setLastUpdated(
      new Date()
    );

    setLoading(false);
  };


  // -------------------------------------------------------
  // INITIAL LOAD + AUTOMATIC REFRESH
  // -------------------------------------------------------

  useEffect(() => {

    refreshDashboard();

    const interval = setInterval(() => {

      fetchSystemData();
      fetchSecurityAlerts();
      fetchAlertHistory();

      setLastUpdated(
        new Date()
      );

    }, 5000);

    return () => {
      clearInterval(interval);
    };

  }, []);


  // =======================================================
  // DATA HELPERS
  // =======================================================

  const cpuUsage =
    system?.cpu?.usage_percent ?? null;

  const memoryUsage =
    system?.memory?.usage_percent ?? null;

  const diskUsage =
    system?.disk?.usage_percent ?? null;


  const formatPercent = (value) => {

    if (
      value === null ||
      value === undefined
    ) {
      return "--";
    }

    return Number(value).toFixed(1);
  };


  const formatBytes = (bytes) => {

    if (
      bytes === null ||
      bytes === undefined
    ) {
      return "--";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB"
    ];

    let value = bytes;
    let index = 0;

    while (
      value >= 1024 &&
      index < units.length - 1
    ) {

      value /= 1024;
      index++;

    }

    return `${value.toFixed(1)} ${units[index]}`;
  };


  const formatTime = (timestamp) => {

    if (!timestamp) {
      return "NOW";
    }

    const date = new Date(
      timestamp
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "NOW";
    }

    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  };


  // =======================================================
  // ALERT HELPERS
  // =======================================================

  const activeAlertCount =
    alerts.filter(
      (alert) =>
        alert.status === "active"
    ).length;


  const resolvedAlertCount =
    alertHistory.filter(
      (alert) =>
        alert.status === "resolved"
    ).length;


  const currentAlert =
    alerts.length > 0
      ? alerts[0]
      : null;


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="app">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ◇
          </div>

          <div>

            <h2>
              CyberSentinel
            </h2>

            <span>
              Security Console
            </span>

          </div>

        </div>


        <nav>

          <div className="nav-item active">
            ◈ Dashboard
          </div>

          <div className="nav-item">
            ◉ System Monitor
          </div>

          <div className="nav-item">
            ⌁ Network
          </div>

          <div className="nav-item">
            △ Threats
          </div>

          <div className="nav-item">
            ▤ Logs
          </div>

          <div className="nav-item">
            ⚙ Security Checks
          </div>

        </nav>


        <div className="sidebar-bottom">

          <div className="connection">

            <span className="pulse"></span>

            {backendOnline
              ? "Backend Connected"
              : "Backend Offline"}

          </div>

          <small>
            CyberSentinel v1.0
          </small>

        </div>

      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main">


        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="topbar">

          <div>

            <div className="eyebrow">
              SECURITY OPERATIONS CENTER
            </div>

            <h1>
              Dashboard
            </h1>

            <p>
              Real-time visibility into your Linux environment.
            </p>

          </div>


          <div className="top-actions">

            <div className="live">

              <span></span>

              {backendOnline
                ? "LIVE MONITORING"
                : "BACKEND OFFLINE"}

            </div>


            <div className="avatar">
              SP
            </div>

          </div>

        </header>


        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="stats">


          {/* CPU */}

          <div className="stat-card cyan">

            <div className="stat-header">

              <span>
                CPU LOAD
              </span>

              <span className="stat-icon">
                ◉
              </span>

            </div>


            <div className="stat-value">

              {formatPercent(cpuUsage)}

              <small>
                %
              </small>

            </div>


            <div className="progress">

              <div
                style={{
                  width:
                    cpuUsage !== null
                      ? `${Math.min(
                          Math.max(cpuUsage, 0),
                          100
                        )}%`
                      : "0%"
                }}
              />

            </div>


            <p>
              System processor utilization
            </p>

          </div>


          {/* MEMORY */}

          <div className="stat-card purple">

            <div className="stat-header">

              <span>
                MEMORY
              </span>

              <span className="stat-icon">
                ▣
              </span>

            </div>


            <div className="stat-value">

              {formatPercent(memoryUsage)}

              <small>
                %
              </small>

            </div>


            <div className="progress">

              <div
                style={{
                  width:
                    memoryUsage !== null
                      ? `${Math.min(
                          Math.max(memoryUsage, 0),
                          100
                        )}%`
                      : "0%"
                }}
              />

            </div>


            <p>
              RAM utilization
            </p>

          </div>


          {/* DISK */}

          <div className="stat-card orange">

            <div className="stat-header">

              <span>
                DISK
              </span>

              <span className="stat-icon">
                ◫
              </span>

            </div>


            <div className="stat-value">

              {formatPercent(diskUsage)}

              <small>
                %
              </small>

            </div>


            <div className="progress">

              <div
                style={{
                  width:
                    diskUsage !== null
                      ? `${Math.min(
                          Math.max(diskUsage, 0),
                          100
                        )}%`
                      : "0%"
                }}
              />

            </div>


            <p>
              Root filesystem usage
            </p>

          </div>


          {/* ACTIVE THREATS */}

          <div className="stat-card red">

            <div className="stat-header">

              <span>
                THREATS
              </span>

              <span className="stat-icon">
                △
              </span>

            </div>


            <div className="stat-value">

              {loading
                ? "--"
                : activeAlertCount
                    .toString()
                    .padStart(2, "0")}

            </div>


            <div className="threat-status">

              {activeAlertCount > 0
                ? "ACTIVE ALERT"
                : "SYSTEM CLEAR"}

            </div>


            <p>
              Active security events
            </p>

          </div>

        </section>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <section className="content-grid">


          {/* =================================================
              THREAT INTELLIGENCE
          ================================================= */}

          <div className="panel">

            <div className="panel-title">

              <div>

                <div className="eyebrow">
                  THREAT INTELLIGENCE
                </div>

                <h2>
                  Security Overview
                </h2>

              </div>


              <button
                onClick={refreshDashboard}
              >
                REFRESH ↻
              </button>

            </div>


            {/* CURRENT ALERT */}

            <div className="threat-banner">

              <div className="threat-ring">
                {currentAlert
                  ? "!"
                  : "✓"}
              </div>


              <div>

                <span>

                  {currentAlert
                    ? "ATTENTION REQUIRED"
                    : "SYSTEM CLEAR"}

                </span>


                <h3>

                  {currentAlert
                    ? currentAlert.message
                    : "No active security alerts"}

                </h3>


                <p>

                  {currentAlert

                    ? `CyberSentinel detected an active ${currentAlert.type} event from ${currentAlert.source}.`

                    : "CyberSentinel has not detected any current security events."}

                </p>

              </div>


              <div className="severity">

                {currentAlert
                  ? currentAlert.severity.toUpperCase()
                  : "CLEAR"}

              </div>

            </div>


            {/* =================================================
                SYSTEM ACTIVITY
            ================================================= */}

            <div className="activity">

              <div className="activity-title">
                SYSTEM ACTIVITY
              </div>


              {alertHistory.length === 0 ? (

                <div className="activity-row">

                  <div className="activity-dot"></div>

                  <div>

                    <strong>
                      No alert history
                    </strong>

                    <p>
                      CyberSentinel has not stored any security events yet.
                    </p>

                  </div>

                  <time>
                    NOW
                  </time>

                </div>

              ) : (

                alertHistory
                  .slice(0, 4)
                  .map(
                    (alert, index) => (

                      <div
                        className="activity-row"
                        key={alert.id || index}
                      >

                        <div
                          className={
                            `activity-dot ${
                              index % 3 === 1
                                ? "cyan-dot"
                                : index % 3 === 2
                                ? "purple-dot"
                                : ""
                            }`
                          }
                        ></div>


                        <div>

                          <strong>
                            {alert.message}
                          </strong>

                          <p>

                            {alert.type}
                            {" · "}
                            {alert.source}
                            {" · "}
                            {alert.status?.toUpperCase()}

                          </p>

                        </div>


                        <time>
                          {formatTime(
                            alert.created_at
                          )}
                        </time>

                      </div>

                    )
                  )

              )}

            </div>

          </div>


          {/* =================================================
              SYSTEM HEALTH
          ================================================= */}

          <div className="panel">

            <div className="panel-title">

              <div>

                <div className="eyebrow">
                  SYSTEM
                </div>

                <h2>
                  Health
                </h2>

              </div>


              <div className="healthy">

                <span>
                  ●
                </span>{" "}

                {backendOnline
                  ? "HEALTHY"
                  : "OFFLINE"}

              </div>

            </div>


            <div className="health-item">

              <span>
                API Server
              </span>

              <strong>
                {backendOnline
                  ? "ONLINE"
                  : "OFFLINE"}
              </strong>

            </div>


            <div className="health-item">

              <span>
                Database
              </span>

              <strong>
                {backendOnline
                  ? "ONLINE"
                  : "UNKNOWN"}
              </strong>

            </div>


            <div className="health-item">

              <span>
                Threat Engine
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>


            <div className="health-item">

              <span>
                Security Checks
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>


            <div className="health-score">

              <div className="score">

                {backendOnline
                  ? "100"
                  : "00"}

              </div>


              <div>

                <strong>
                  Platform Status
                </strong>

                <p>

                  {backendOnline
                    ? "All core services responding"
                    : "Unable to reach FastAPI backend"}

                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            BOTTOM INFORMATION
        ================================================= */}

        <section className="bottom-grid">


          {/* MEMORY AVAILABLE */}

          <div className="mini-panel">

            <span>
              MEMORY AVAILABLE
            </span>

            <strong>

              {system
                ? formatBytes(
                    system.memory.available_bytes
                  )
                : "--"}

            </strong>

            <p>
              Available system memory
            </p>

          </div>


          {/* DISK FREE */}

          <div className="mini-panel">

            <span>
              DISK FREE
            </span>

            <strong>

              {system
                ? formatBytes(
                    system.disk.free_bytes
                  )
                : "--"}

            </strong>

            <p>
              Available root filesystem space
            </p>

          </div>


          {/* ALERT HISTORY */}

          <div className="mini-panel">

            <span>
              RESOLVED EVENTS
            </span>

            <strong>
              {resolvedAlertCount}
            </strong>

            <p>
              Historical resolved security events
            </p>

          </div>


          {/* LAST UPDATE */}

          <div className="mini-panel">

            <span>
              LAST UPDATE
            </span>

            <strong>

              {lastUpdated
                ? lastUpdated.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    }
                  )
                : "--:--:--"}

            </strong>

            <p>
              Dashboard refresh interval: 5 sec
            </p>

          </div>

        </section>


      </main>

    </div>

  );
}


export default App;
