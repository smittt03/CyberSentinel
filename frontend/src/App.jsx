import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

/* =========================================================
   UTILITIES
   ========================================================= */

function formatBytes(bytes) {
  if (!bytes) return "0 GB";

  const gb = bytes / (1024 ** 3);

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }

  return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

/* =========================================================
   REUSABLE COMPONENTS
   ========================================================= */

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span>{title}</span>
        <span className="metric-dot">●</span>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-subtitle">
        {subtitle}
      </div>
    </div>
  );
}

function UsageBar({ label, percentage }) {
  const safePercentage = Math.min(
    Math.max(Number(percentage) || 0, 0),
    100
  );

  return (
    <div className="usage-section">
      <div className="usage-header">
        <span>{label}</span>
        <span>{safePercentage.toFixed(1)}%</span>
      </div>

      <div className="usage-track">
        <div
          className="usage-fill"
          style={{
            width: `${safePercentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   MODULE 01
   SYSTEM MONITOR
   ========================================================= */

function SystemMonitor() {
  const [system, setSystem] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function fetchSystemMetrics() {
    try {
      const response = await fetch(
        `${API_BASE}/api/system`
      );

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      setSystem(data);
      setConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(
        "System monitor error:",
        error
      );

      setConnected(false);
    }
  }

  useEffect(() => {
    fetchSystemMetrics();

    const interval = setInterval(
      fetchSystemMetrics,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">
            MODULE / 01
          </p>

          <h1>SYSTEM MONITOR</h1>

          <p className="page-description">
            Real-time visibility into host resource utilization.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />

          {connected
            ? "LIVE MONITORING"
            : "TELEMETRY OFFLINE"}
        </div>
      </section>

      {!system ? (
        <div className="loading-panel">
          <div className="loading-text">
            INITIALIZING SYSTEM TELEMETRY...
          </div>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="CPU USAGE"
              value={`${system.cpu.usage_percent.toFixed(1)}%`}
              subtitle={`${system.cpu.logical_cores} logical cores`}
            />

            <MetricCard
              title="MEMORY USAGE"
              value={`${system.memory.usage_percent.toFixed(1)}%`}
              subtitle={`${formatBytes(
                system.memory.available_bytes
              )} available`}
            />

            <MetricCard
              title="DISK USAGE"
              value={`${system.disk.usage_percent.toFixed(1)}%`}
              subtitle={`${formatBytes(
                system.disk.free_bytes
              )} free`}
            />
          </section>

          <section className="monitor-grid">
            <div className="panel">
              <div className="panel-heading">
                <span>RESOURCE UTILIZATION</span>

                <span className="panel-tag">
                  LIVE
                </span>
              </div>

              <UsageBar
                label="CPU"
                percentage={
                  system.cpu.usage_percent
                }
              />

              <UsageBar
                label="MEMORY"
                percentage={
                  system.memory.usage_percent
                }
              />

              <UsageBar
                label="DISK"
                percentage={
                  system.disk.usage_percent
                }
              />
            </div>

            <div className="panel">
              <div className="panel-heading">
                <span>HOST INFORMATION</span>

                <span className="panel-tag">
                  TELEMETRY
                </span>
              </div>

              <div className="info-row">
                <span>Logical Cores</span>
                <strong>
                  {system.cpu.logical_cores}
                </strong>
              </div>

              <div className="info-row">
                <span>Physical Cores</span>
                <strong>
                  {system.cpu.physical_cores}
                </strong>
              </div>

              <div className="info-row">
                <span>Total Memory</span>
                <strong>
                  {formatBytes(
                    system.memory.total_bytes
                  )}
                </strong>
              </div>

              <div className="info-row">
                <span>Used Memory</span>
                <strong>
                  {formatBytes(
                    system.memory.used_bytes
                  )}
                </strong>
              </div>

              <div className="info-row">
                <span>Total Disk</span>
                <strong>
                  {formatBytes(
                    system.disk.total_bytes
                  )}
                </strong>
              </div>

              <div className="info-row">
                <span>Free Disk</span>
                <strong>
                  {formatBytes(
                    system.disk.free_bytes
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">
                TELEMETRY SOURCE
              </span>

              <span className="status-value">
                psutil / Linux host
              </span>
            </div>

            <div>
              <span className="status-key">
                REFRESH
              </span>

              <span className="status-value">
                5 seconds
              </span>
            </div>

            <div>
              <span className="status-key">
                LAST UPDATE
              </span>

              <span className="status-value">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString()
                  : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   MODULE 02
   NETWORK DISCOVERY
   ========================================================= */

function NetworkDashboard() {
  const [target, setTarget] =
    useState("127.0.0.1");

  const [result, setResult] =
    useState(null);

  const [scanning, setScanning] =
    useState(false);

  const [error, setError] =
    useState("");

  async function runNetworkScan(event) {
    event.preventDefault();

    if (!target.trim()) {
      setError("Please enter a target.");
      return;
    }

    setScanning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/network/scan?target=${encodeURIComponent(
          target.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Network scan request failed"
        );
      }

      const data = await response.json();

      setResult(data);
    } catch (scanError) {
      console.error(
        "Network scan error:",
        scanError
      );

      setError(
        "Unable to complete the network scan. Check that the backend is running."
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">
            MODULE / 02
          </p>

          <h1>NETWORK DISCOVERY</h1>

          <p className="page-description">
            Discover hosts and exposed services on authorized networks.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />
          NMAP ENGINE
        </div>
      </section>

      <section className="scan-panel">
        <div className="panel-heading">
          <span>NETWORK SCAN</span>

          <span className="panel-tag">
            AUTHORIZED TARGETS ONLY
          </span>
        </div>

        <form
          className="scan-form"
          onSubmit={runNetworkScan}
        >
          <div className="target-field">
            <label htmlFor="network-target">
              TARGET
            </label>

            <input
              id="network-target"
              type="text"
              value={target}
              onChange={(event) =>
                setTarget(event.target.value)
              }
              placeholder="127.0.0.1"
              disabled={scanning}
            />
          </div>

          <button
            type="submit"
            className="scan-button"
            disabled={scanning}
          >
            {scanning
              ? "SCANNING..."
              : "START SCAN"}
          </button>
        </form>

        <div className="scan-warning">
          Only scan systems and networks you are authorized to assess.
        </div>
      </section>

      {error && (
        <div className="error-panel">
          <span>⚠</span>
          {error}
        </div>
      )}

      {scanning && (
        <div className="loading-panel">
          <div className="loading-text">
            NMAP DISCOVERY IN PROGRESS...
          </div>
        </div>
      )}

      {result && !scanning && (
        <>
          <section className="network-summary">
            <MetricCard
              title="TARGET"
              value={result.target}
              subtitle="Scanned target"
            />

            <MetricCard
              title="HOST STATUS"
              value={
                result.host_up
                  ? "UP"
                  : "DOWN"
              }
              subtitle={
                result.host_up
                  ? "Host responded to discovery"
                  : "Host did not respond"
              }
            />

            <MetricCard
              title="OPEN PORTS"
              value={result.ports.length}
              subtitle="TCP services detected"
            />
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>
                DISCOVERED SERVICES
              </span>

              <span className="panel-tag">
                {result.ports.length} RESULT
                {result.ports.length === 1
                  ? ""
                  : "S"}
              </span>
            </div>

            {result.ports.length === 0 ? (
              <div className="empty-state">
                No open ports were detected on the target.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="network-table">
                  <thead>
                    <tr>
                      <th>PORT</th>
                      <th>PROTOCOL</th>
                      <th>STATE</th>
                      <th>SERVICE</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.ports.map(
                      (port) => (
                        <tr
                          key={`${port.port}-${port.protocol}`}
                        >
                          <td className="port-number">
                            {port.port}
                          </td>

                          <td>
                            {port.protocol.toUpperCase()}
                          </td>

                          <td>
                            <span className="port-status">
                              ●{" "}
                              {port.state.toUpperCase()}
                            </span>
                          </td>

                          <td>
                            {port.service ||
                              "unknown"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="network-footer">
            <span>
              NMAP RETURN CODE:{" "}
              {result.return_code}
            </span>

            <span>
              TARGET: {result.target}
            </span>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   MODULE 03
   PROCESS MONITOR
   ========================================================= */

function ProcessMonitor() {
  const [processes, setProcesses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const [lastUpdate, setLastUpdate] =
    useState(null);

  const [sortBy, setSortBy] =
    useState("cpu_percent");

  async function fetchProcesses() {
    try {
      const response = await fetch(
        `${API_BASE}/api/processes`
      );

      if (!response.ok) {
        throw new Error(
          "Process API request failed"
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid process telemetry format"
        );
      }

      setProcesses(data);
      setConnected(true);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(
        "Process monitor error:",
        error
      );

      setConnected(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProcesses();

    const interval = setInterval(
      fetchProcesses,
      5000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const statistics = useMemo(() => {
    const total = processes.length;

    const active = processes.filter(
      (process) =>
        ![
          "sleeping",
          "idle",
          "stopped",
          "zombie",
        ].includes(
          String(
            process.status
          ).toLowerCase()
        )
    ).length;

    const highCpu = processes.filter(
      (process) =>
        Number(process.cpu_percent) >= 5
    ).length;

    return {
      total,
      active,
      highCpu,
    };
  }, [processes]);

  const sortedProcesses = useMemo(() => {
    return [...processes]
      .sort((a, b) => {
        if (sortBy === "memory_percent") {
          return (
            Number(
              b.memory_percent || 0
            ) -
            Number(
              a.memory_percent || 0
            )
          );
        }

        if (sortBy === "name") {
          return String(
            a.name
          ).localeCompare(
            String(b.name)
          );
        }

        return (
          Number(
            b.cpu_percent || 0
          ) -
          Number(
            a.cpu_percent || 0
          )
        );
      })
      .slice(0, 25);
  }, [processes, sortBy]);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">
            MODULE / 03
          </p>

          <h1>PROCESS MONITOR</h1>

          <p className="page-description">
            Observe running processes and identify unusual resource consumption.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />

          {connected
            ? "LIVE TELEMETRY"
            : "TELEMETRY OFFLINE"}
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <div className="loading-text">
            INITIALIZING PROCESS TELEMETRY...
          </div>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="TOTAL PROCESSES"
              value={statistics.total}
              subtitle="Processes detected"
            />

            <MetricCard
              title="ACTIVE PROCESSES"
              value={statistics.active}
              subtitle="Currently active"
            />

            <MetricCard
              title="HIGH CPU"
              value={statistics.highCpu}
              subtitle="Processes above 5% CPU"
            />
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>
                PROCESS TELEMETRY
              </span>

              <span className="panel-tag">
                TOP 25
              </span>
            </div>

            <div className="process-controls">
              <span className="process-control-label">
                SORT BY
              </span>

              <button
                className={
                  sortBy === "cpu_percent"
                    ? "process-sort active"
                    : "process-sort"
                }
                onClick={() =>
                  setSortBy("cpu_percent")
                }
              >
                CPU
              </button>

              <button
                className={
                  sortBy === "memory_percent"
                    ? "process-sort active"
                    : "process-sort"
                }
                onClick={() =>
                  setSortBy(
                    "memory_percent"
                  )
                }
              >
                MEMORY
              </button>

              <button
                className={
                  sortBy === "name"
                    ? "process-sort active"
                    : "process-sort"
                }
                onClick={() =>
                  setSortBy("name")
                }
              >
                NAME
              </button>
            </div>

            <div className="table-wrapper">
              <table className="network-table process-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>PROCESS</th>
                    <th>CPU</th>
                    <th>MEMORY</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedProcesses.map(
                    (process) => {
                      const cpu =
                        Number(
                          process.cpu_percent
                        ) || 0;

                      const memory =
                        Number(
                          process.memory_percent
                        ) || 0;

                      const status =
                        String(
                          process.status ||
                            "unknown"
                        ).toLowerCase();

                      const highCpu =
                        cpu >= 5;

                      return (
                        <tr
                          key={`${process.pid}-${process.name}`}
                        >
                          <td className="port-number">
                            {process.pid}
                          </td>

                          <td>
                            <span
                              className={
                                highCpu
                                  ? "process-name high-resource"
                                  : "process-name"
                              }
                            >
                              {process.name}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                highCpu
                                  ? "resource-warning"
                                  : ""
                              }
                            >
                              {cpu.toFixed(1)}%
                            </span>
                          </td>

                          <td>
                            {memory.toFixed(2)}%
                          </td>

                          <td>
                            <span className="process-status">
                              <span
                                className={
                                  status ===
                                  "running"
                                    ? "process-status-dot running"
                                    : "process-status-dot"
                                }
                              />

                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">
                TELEMETRY SOURCE
              </span>

              <span className="status-value">
                psutil / Linux process table
              </span>
            </div>

            <div>
              <span className="status-key">
                REFRESH
              </span>

              <span className="status-value">
                5 seconds
              </span>
            </div>

            <div>
              <span className="status-key">
                LAST UPDATE
              </span>

              <span className="status-value">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString()
                  : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   MODULE 04
   LOG ANALYZER
   ========================================================= */

function LogAnalyzer() {
  const [logData, setLogData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const [lastUpdate, setLastUpdate] =
    useState(null);

  const [lines, setLines] =
    useState(50);

  async function fetchLogs() {
    try {
      const response = await fetch(
        `${API_BASE}/api/logs?lines=${lines}`
      );

      if (!response.ok) {
        throw new Error(
          "Log API request failed"
        );
      }

      const data = await response.json();

      setLogData(data);
      setConnected(true);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(
        "Log analyzer error:",
        error
      );

      setConnected(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);

    fetchLogs();

    const interval = setInterval(
      fetchLogs,
      5000
    );

    return () =>
      clearInterval(interval);
  }, [lines]);

  const events =
    logData?.events || [];

  const flaggedEvents =
    events.filter(
      (event) => event.flagged
    );

  const normalEvents =
    events.filter(
      (event) => !event.flagged
    );

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">
            MODULE / 04
          </p>

          <h1>LOG ANALYZER</h1>

          <p className="page-description">
            Inspect system logs and identify suspicious security events.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />

          {connected
            ? "LIVE LOG TELEMETRY"
            : "TELEMETRY OFFLINE"}
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <div className="loading-text">
            INITIALIZING LOG TELEMETRY...
          </div>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="LOG EVENTS"
              value={events.length}
              subtitle="Events analyzed"
            />

            <MetricCard
              title="FLAGGED EVENTS"
              value={flaggedEvents.length}
              subtitle="Suspicious events detected"
            />

            <MetricCard
              title="NORMAL EVENTS"
              value={normalEvents.length}
              subtitle="Events without indicators"
            />
          </section>

          <section className="panel log-controls-panel">
            <div className="panel-heading">
              <span>
                LOG TELEMETRY
              </span>

              <span className="panel-tag">
                JOURNALCTL
              </span>
            </div>

            <div className="log-controls">
              <span className="log-control-label">
                EVENTS TO ANALYZE
              </span>

              <button
                className={
                  lines === 20
                    ? "log-limit active"
                    : "log-limit"
                }
                onClick={() =>
                  setLines(20)
                }
              >
                20
              </button>

              <button
                className={
                  lines === 50
                    ? "log-limit active"
                    : "log-limit"
                }
                onClick={() =>
                  setLines(50)
                }
              >
                50
              </button>

              <button
                className={
                  lines === 100
                    ? "log-limit active"
                    : "log-limit"
                }
                onClick={() =>
                  setLines(100)
                }
              >
                100
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>
                RECENT SYSTEM EVENTS
              </span>

              <span className="panel-tag">
                {events.length} EVENTS
              </span>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                No log events were returned.
              </div>
            ) : (
              <div className="log-list">
                {events.map(
                  (event, index) => (
                    <div
                      key={`${index}-${event.message}`}
                      className={
                        event.flagged
                          ? "log-event flagged"
                          : "log-event"
                      }
                    >
                      <div className="log-event-status">
                        <span
                          className={
                            event.flagged
                              ? "log-status-dot flagged"
                              : "log-status-dot"
                          }
                        />

                        <span
                          className={
                            event.flagged
                              ? "log-status flagged"
                              : "log-status"
                          }
                        >
                          {event.flagged
                            ? "FLAGGED"
                            : "NORMAL"}
                        </span>
                      </div>

                      <div className="log-message">
                        {event.message}
                      </div>

                      {event.keywords &&
                        event.keywords.length >
                          0 && (
                          <div className="log-keywords">
                            {event.keywords.map(
                              (keyword) => (
                                <span
                                  key={
                                    keyword
                                  }
                                  className="log-keyword"
                                >
                                  {keyword}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">
                TELEMETRY SOURCE
              </span>

              <span className="status-value">
                journalctl / Linux journal
              </span>
            </div>

            <div>
              <span className="status-key">
                ANALYSIS
              </span>

              <span className="status-value">
                Keyword-based detection
              </span>
            </div>

            <div>
              <span className="status-key">
                LAST UPDATE
              </span>

              <span className="status-value">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString()
                  : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   MODULE 05
   SECURITY CHECKS
   ========================================================= */

function SecurityChecks() {
  const [securityData, setSecurityData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const [lastUpdate, setLastUpdate] =
    useState(null);

  async function fetchSecurityChecks() {
    try {
      const response = await fetch(
        `${API_BASE}/api/security/checks`
      );

      if (!response.ok) {
        throw new Error(
          "Security API request failed"
        );
      }

      const data = await response.json();

      setSecurityData(data);
      setConnected(true);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error(
        "Security checks error:",
        error
      );

      setConnected(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSecurityChecks();

    const interval = setInterval(
      fetchSecurityChecks,
      5000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const checks =
    securityData?.checks || [];

  const passedChecks =
    checks.filter(
      (check) => check.status === "pass"
    );

  const warningChecks =
    checks.filter(
      (check) => check.status === "warning"
    );

  const infoChecks =
    checks.filter(
      (check) => check.status === "info"
    );

  function getCheckTitle(check) {
    switch (check.check) {
      case "root_privileges":
        return "ROOT PRIVILEGE STATUS";

      case "listening_services":
        return "LISTENING SERVICES";

      case "disk_usage":
        return "DISK USAGE";

      default:
        return String(
          check.check || "SECURITY CHECK"
        )
          .replaceAll("_", " ")
          .toUpperCase();
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "pass":
        return "PASS";

      case "warning":
        return "WARNING";

      case "info":
        return "INFO";

      default:
        return String(status).toUpperCase();
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">
            MODULE / 05
          </p>

          <h1>SECURITY CHECKS</h1>

          <p className="page-description">
            Evaluate host security conditions and identify configuration warnings.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />

          {connected
            ? "LIVE SECURITY CHECKS"
            : "CHECKS OFFLINE"}
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <div className="loading-text">
            RUNNING SECURITY CHECKS...
          </div>
        </div>
      ) : (
        <>
          {/* SECURITY SUMMARY */}

          <section className="metrics-grid">
            <MetricCard
              title="CHECKS RUN"
              value={checks.length}
              subtitle="Security checks performed"
            />

            <MetricCard
              title="PASSED"
              value={passedChecks.length}
              subtitle="Conditions within expected range"
            />

            <MetricCard
              title="WARNINGS"
              value={warningChecks.length}
              subtitle="Conditions requiring attention"
            />
          </section>

          {/* SECURITY STATUS */}

          <section className="panel">
            <div className="panel-heading">
              <span>
                SECURITY POSTURE CHECKS
              </span>

              <span className="panel-tag">
                {checks.length} CHECKS
              </span>
            </div>

            <div className="security-check-list">
              {checks.map(
                (check, index) => (
                  <div
                    className={`security-check ${
                      check.status
                    }`}
                    key={`${check.check}-${index}`}
                  >
                    <div className="security-check-header">
                      <div className="security-check-title">
                        <span
                          className={`security-status-dot ${check.status}`}
                        />

                        <span>
                          {getCheckTitle(
                            check
                          )}
                        </span>
                      </div>

                      <span
                        className={`security-badge ${check.status}`}
                      >
                        {getStatusLabel(
                          check.status
                        )}
                      </span>
                    </div>

                    {check.message && (
                      <div className="security-message">
                        {check.message}
                      </div>
                    )}

                    {/* DISK DETAILS */}

                    {check.check ===
                      "disk_usage" && (
                      <div className="security-detail-grid">
                        <div>
                          <span>
                            USAGE
                          </span>

                          <strong>
                            {Number(
                              check.usage_percent
                            ).toFixed(1)}
                            %
                          </strong>
                        </div>

                        <div>
                          <span>
                            FREE SPACE
                          </span>

                          <strong>
                            {formatBytes(
                              check.free_bytes
                            )}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* LISTENING SERVICES */}

                    {check.check ===
                      "listening_services" && (
                      <div className="services-section">
                        <div className="services-header">
                          <span>
                            DETECTED SERVICES
                          </span>

                          <span>
                            {check.services
                              ?.length || 0}
                          </span>
                        </div>

                        {check.services &&
                        check.services.length >
                          0 ? (
                          <div className="service-list">
                            {check.services.map(
                              (
                                service,
                                serviceIndex
                              ) => (
                                <div
                                  className="service-row"
                                  key={`${service.protocol}-${service.local_address}-${serviceIndex}`}
                                >
                                  <span className="service-protocol">
                                    {String(
                                      service.protocol
                                    ).toUpperCase()}
                                  </span>

                                  <span>
                                    {
                                      service.local_address
                                    }
                                  </span>

                                  <span className="service-state">
                                    {service.state ===
                                    "LISTEN"
                                      ? "LISTEN"
                                      : service.state ||
                                        "OPEN"}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="empty-state compact">
                            No listening services detected.
                          </div>
                        )}
                      </div>
                    )}

                    {/* RETURN CODE */}

                    {check.return_code !==
                      undefined && (
                      <div className="check-footer">
                        COMMAND RETURN CODE:{" "}
                        {check.return_code}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* INFORMATION PANEL */}

          <section className="panel security-info-panel">
            <div className="panel-heading">
              <span>
                SECURITY ANALYSIS
              </span>

              <span className="panel-tag">
                RULE BASED
              </span>
            </div>

            <div className="security-analysis-grid">
              <div>
                <span className="analysis-number">
                  {warningChecks.length}
                </span>

                <span className="analysis-label">
                  WARNINGS
                </span>
              </div>

              <div>
                <span className="analysis-number">
                  {infoChecks.length}
                </span>

                <span className="analysis-label">
                  INFORMATIONAL
                </span>
              </div>

              <div>
                <span className="analysis-number">
                  {passedChecks.length}
                </span>

                <span className="analysis-label">
                  PASSED
                </span>
              </div>
            </div>

            <p className="security-analysis-note">
              Security checks provide rule-based visibility into host privileges, listening services, and resource conditions. Findings are evaluated by the CyberSentinel backend and can be consumed by the threat engine.
            </p>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">
                TELEMETRY SOURCE
              </span>

              <span className="status-value">
                Linux security checks
              </span>
            </div>

            <div>
              <span className="status-key">
                ANALYSIS
              </span>

              <span className="status-value">
                Rule-based evaluation
              </span>
            </div>

            <div>
              <span className="status-key">
                LAST UPDATE
              </span>

              <span className="status-value">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString()
                  : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}


/* =========================================================
   MODULE 06
   THREAT CENTER
   ========================================================= */

function ThreatCenter() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [historyAlerts, setHistoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [view, setView] = useState("active");

  async function fetchThreatData() {
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE}/api/security/alerts`),
        fetch(`${API_BASE}/api/alerts?limit=50`),
      ]);

      if (!activeResponse.ok || !historyResponse.ok) {
        throw new Error("Threat API request failed");
      }

      const activeData = await activeResponse.json();
      const historyData = await historyResponse.json();

      setActiveAlerts(
        Array.isArray(activeData.alerts) ? activeData.alerts : []
      );

      setHistoryAlerts(
        Array.isArray(historyData.alerts) ? historyData.alerts : []
      );

      setConnected(true);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Threat center error:", error);
      setConnected(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchThreatData();

    const interval = setInterval(fetchThreatData, 5000);

    return () => clearInterval(interval);
  }, []);

  const displayedAlerts =
    view === "active"
      ? activeAlerts
      : historyAlerts.filter((alert) => alert.status === "resolved");

  const highAlerts = activeAlerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "high"
  );

  const mediumAlerts = activeAlerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "medium"
  );

  const infoAlerts = activeAlerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "info"
  );

  function getSeverityLabel(severity) {
    return String(severity || "unknown").toUpperCase();
  }

  function getSeverityClass(severity) {
    const normalized = String(severity || "").toLowerCase();

    if (normalized === "high") return "warning";
    if (normalized === "medium") return "warning";
    if (normalized === "info") return "info";

    return "pass";
  }

  function formatAlertTime(value) {
    if (!value) return "UNKNOWN";

    const date = new Date(
      String(value).endsWith("Z") ? value : `${value}Z`
    );

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">MODULE / 06</p>

          <h1>THREAT CENTER</h1>

          <p className="page-description">
            Centralized view of detected security events and alert lifecycle.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />

          {connected
            ? "LIVE THREAT TELEMETRY"
            : "THREAT ENGINE OFFLINE"}
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <div className="loading-text">
            INITIALIZING THREAT ENGINE...
          </div>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="ACTIVE THREATS"
              value={activeAlerts.length}
              subtitle="Currently active alerts"
            />

            <MetricCard
              title="HIGH SEVERITY"
              value={highAlerts.length}
              subtitle="High-priority alerts"
            />

            <MetricCard
              title="MEDIUM / INFO"
              value={mediumAlerts.length + infoAlerts.length}
              subtitle="Lower severity alerts"
            />
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>ALERT LIFECYCLE</span>

              <span className="panel-tag">
                {historyAlerts.length} TOTAL EVENTS
              </span>
            </div>

            <div className="process-controls">
              <span className="process-control-label">
                VIEW
              </span>

              <button
                className={
                  view === "active"
                    ? "process-sort active"
                    : "process-sort"
                }
                onClick={() => setView("active")}
              >
                ACTIVE
              </button>

              <button
                className={
                  view === "resolved"
                    ? "process-sort active"
                    : "process-sort"
                }
                onClick={() => setView("resolved")}
              >
                RESOLVED
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>
                {view === "active"
                  ? "ACTIVE SECURITY ALERTS"
                  : "RESOLVED SECURITY EVENTS"}
              </span>

              <span className="panel-tag">
                {displayedAlerts.length} EVENTS
              </span>
            </div>

            {displayedAlerts.length === 0 ? (
              <div className="empty-state">
                {view === "active"
                  ? "No active security alerts detected."
                  : "No resolved security events recorded."}
              </div>
            ) : (
              <div className="security-check-list">
                {displayedAlerts.map((alert) => {
                  const severityClass = getSeverityClass(
                    alert.severity
                  );

                  return (
                    <div
                      className={`security-check ${severityClass}`}
                      key={alert.id}
                    >
                      <div className="security-check-header">
                        <div className="security-check-title">
                          <span
                            className={`security-status-dot ${severityClass}`}
                          />

                          <span>
                            {getSeverityLabel(alert.severity)}{" "}
                            /{" "}
                            {String(
                              alert.type || "security"
                            ).toUpperCase()}
                          </span>
                        </div>

                        <span
                          className={`security-badge ${severityClass}`}
                        >
                          {String(
                            alert.status || "active"
                          ).toUpperCase()}
                        </span>
                      </div>

                      <div className="security-message">
                        {alert.message}
                      </div>

                      <div className="security-detail-grid">
                        <div>
                          <span>EVENT ID</span>
                          <strong>{alert.id}</strong>
                        </div>

                        <div>
                          <span>SOURCE</span>
                          <strong>
                            {alert.source || "unknown"}
                          </strong>
                        </div>

                        <div>
                          <span>CREATED</span>
                          <strong>
                            {formatAlertTime(
                              alert.created_at
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>RESOLVED</span>
                          <strong>
                            {alert.resolved_at
                              ? formatAlertTime(
                                  alert.resolved_at
                                )
                              : "ACTIVE"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="panel security-info-panel">
            <div className="panel-heading">
              <span>THREAT ENGINE ANALYSIS</span>

              <span className="panel-tag">
                RULE BASED
              </span>
            </div>

            <div className="security-analysis-grid">
              <div>
                <span className="analysis-number">
                  {highAlerts.length}
                </span>

                <span className="analysis-label">
                  HIGH
                </span>
              </div>

              <div>
                <span className="analysis-number">
                  {mediumAlerts.length}
                </span>

                <span className="analysis-label">
                  MEDIUM
                </span>
              </div>

              <div>
                <span className="analysis-number">
                  {infoAlerts.length}
                </span>

                <span className="analysis-label">
                  INFORMATIONAL
                </span>
              </div>
            </div>

            <p className="security-analysis-note">
              Alerts are generated from CyberSentinel security
              checks, persisted in SQLite, and tracked as active
              or resolved events.
            </p>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">
                ALERT SOURCE
              </span>

              <span className="status-value">
                CyberSentinel threat engine
              </span>
            </div>

            <div>
              <span className="status-key">
                REFRESH
              </span>

              <span className="status-value">
                5 seconds
              </span>
            </div>

            <div>
              <span className="status-key">
                LAST UPDATE
              </span>

              <span className="status-value">
                {lastUpdate
                  ? lastUpdate.toLocaleTimeString()
                  : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   MODULE 07
   SECURITY OVERVIEW / SOC COMMAND CENTER
   ========================================================= */

function SecurityOverview() {
  const [overview, setOverview] = useState({
    system: null,
    processes: [],
    logs: null,
    security: null,
    alerts: [],
  });

  const [loading, setLoading] = useState(true);
  const [connectedModules, setConnectedModules] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function fetchOverview() {
    const requests = [
      fetch(`${API_BASE}/api/system`),
      fetch(`${API_BASE}/api/processes`),
      fetch(`${API_BASE}/api/logs?lines=20`),
      fetch(`${API_BASE}/api/security/checks`),
      fetch(`${API_BASE}/api/security/alerts`),
    ];

    const results = await Promise.allSettled(requests);

    const nextOverview = {
      system: null,
      processes: [],
      logs: null,
      security: null,
      alerts: [],
    };

    let connected = 0;

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];

      if (result.status !== "fulfilled" || !result.value.ok) {
        continue;
      }

      try {
        const data = await result.value.json();
        connected += 1;

        if (index === 0) nextOverview.system = data;
        if (index === 1) nextOverview.processes = Array.isArray(data) ? data : [];
        if (index === 2) nextOverview.logs = data;
        if (index === 3) nextOverview.security = data;
        if (index === 4) {
          nextOverview.alerts = Array.isArray(data.alerts) ? data.alerts : [];
        }
      } catch (error) {
        console.error("Overview data parsing error:", error);
      }
    }

    setOverview(nextOverview);
    setConnectedModules(connected);
    setLoading(false);
    setLastUpdate(new Date());
  }

  useEffect(() => {
    fetchOverview();

    const interval = setInterval(fetchOverview, 5000);

    return () => clearInterval(interval);
  }, []);

  const checks = overview.security?.checks || [];
  const passedChecks = checks.filter((check) => check.status === "pass").length;
  const warningChecks = checks.filter((check) => check.status === "warning").length;
  const infoChecks = checks.filter((check) => check.status === "info").length;

  const flaggedLogs = (overview.logs?.events || []).filter(
    (event) => event.flagged
  ).length;

  const highAlerts = overview.alerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "high"
  ).length;

  const mediumAlerts = overview.alerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "medium"
  ).length;

  const infoAlerts = overview.alerts.filter(
    (alert) => String(alert.severity).toLowerCase() === "info"
  ).length;

  const topProcesses = [...overview.processes]
    .sort((a, b) => Number(b.cpu_percent || 0) - Number(a.cpu_percent || 0))
    .slice(0, 5);

  const diskUsage = overview.system?.disk?.usage_percent ?? 0;
  const memoryUsage = overview.system?.memory?.usage_percent ?? 0;
  const cpuUsage = overview.system?.cpu?.usage_percent ?? 0;

  const systemAvailable = Boolean(overview.system);
  const processAvailable = overview.processes.length > 0;
  const logsAvailable = Boolean(overview.logs);
  const securityAvailable = Boolean(overview.security);
  const alertsAvailable = Boolean(overview.alerts);

  return (
    <>
      <section className="page-heading overview-heading">
        <div>
          <p className="section-label">CORE / DASHBOARD</p>
          <h1>SECURITY OVERVIEW</h1>
          <p className="page-description">
            Unified SOC view of CyberSentinel telemetry, security checks,
            processes, logs, and active threat events.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />
          {connectedModules === 5
            ? "ALL TELEMETRY ONLINE"
            : `${connectedModules} / 5 TELEMETRY SOURCES ONLINE`}
        </div>
      </section>

      {loading ? (
        <div className="loading-panel">
          <div className="loading-text">INITIALIZING SOC OVERVIEW...</div>
        </div>
      ) : (
        <>
          <section className="metrics-grid overview-metrics">
            <MetricCard
              title="ACTIVE THREATS"
              value={overview.alerts.length}
              subtitle={`${highAlerts} high / ${mediumAlerts} medium / ${infoAlerts} info`}
            />

            <MetricCard
              title="SECURITY CHECKS"
              value={checks.length}
              subtitle={`${passedChecks} passed / ${warningChecks} warnings / ${infoChecks} info`}
            />

            <MetricCard
              title="RUNNING PROCESSES"
              value={overview.processes.length}
              subtitle="Current process telemetry"
            />

            <MetricCard
              title="FLAGGED LOG EVENTS"
              value={flaggedLogs}
              subtitle="Suspicious keyword matches"
            />
          </section>

          <section className="overview-grid">
            <div className="panel overview-resource-panel">
              <div className="panel-heading">
                <span>SYSTEM TELEMETRY</span>
                <span className="panel-tag">
                  {systemAvailable ? "LIVE" : "OFFLINE"}
                </span>
              </div>

              {systemAvailable ? (
                <div className="overview-resource-content">
                  <UsageBar label="CPU UTILIZATION" percentage={cpuUsage} />
                  <UsageBar label="MEMORY UTILIZATION" percentage={memoryUsage} />
                  <UsageBar label="DISK UTILIZATION" percentage={diskUsage} />

                  <div className="overview-mini-grid">
                    <div>
                      <span>LOGICAL CORES</span>
                      <strong>{overview.system.cpu?.logical_cores ?? "N/A"}</strong>
                    </div>
                    <div>
                      <span>PHYSICAL CORES</span>
                      <strong>{overview.system.cpu?.physical_cores ?? "N/A"}</strong>
                    </div>
                    <div>
                      <span>MEMORY USED</span>
                      <strong>{formatBytes(overview.system.memory?.used_bytes)}</strong>
                    </div>
                    <div>
                      <span>DISK FREE</span>
                      <strong>{formatBytes(overview.system.disk?.free_bytes)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">System telemetry unavailable.</div>
              )}
            </div>

            <div className="panel overview-threat-panel">
              <div className="panel-heading">
                <span>THREAT POSTURE</span>
                <span className="panel-tag">RULE BASED</span>
              </div>

              <div className="overview-threat-summary">
                <div className="overview-threat-number">{overview.alerts.length}</div>
                <div>
                  <strong>ACTIVE SECURITY EVENTS</strong>
                  <p>
                    {overview.alerts.length === 0
                      ? "No active alerts are currently recorded."
                      : "Events detected by the CyberSentinel threat engine."}
                  </p>
                </div>
              </div>

              <div className="overview-severity-grid">
                <div>
                  <span>HIGH</span>
                  <strong>{highAlerts}</strong>
                </div>
                <div>
                  <span>MEDIUM</span>
                  <strong>{mediumAlerts}</strong>
                </div>
                <div>
                  <span>INFO</span>
                  <strong>{infoAlerts}</strong>
                </div>
              </div>

              <div className="overview-status-line">
                <span className="pulse-dot" />
                {alertsAvailable ? "ALERT PIPELINE OPERATIONAL" : "ALERT PIPELINE OFFLINE"}
              </div>
            </div>
          </section>

          <section className="overview-grid">
            <div className="panel">
              <div className="panel-heading">
                <span>TOP PROCESSES</span>
                <span className="panel-tag">CPU ORDER</span>
              </div>

              {!processAvailable ? (
                <div className="empty-state">Process telemetry unavailable.</div>
              ) : (
                <div className="overview-process-list">
                  {topProcesses.map((process) => (
                    <div
                      className="overview-process-row"
                      key={`${process.pid}-${process.name}`}
                    >
                      <div className="overview-process-main">
                        <strong>{process.name || "UNKNOWN"}</strong>
                        <span>PID {process.pid}</span>
                      </div>

                      <div className="overview-process-stats">
                        <span>{Number(process.cpu_percent || 0).toFixed(1)}% CPU</span>
                        <span>{Number(process.memory_percent || 0).toFixed(1)}% MEM</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-heading">
                <span>SECURITY CHECK STATUS</span>
                <span className="panel-tag">MODULE / 05</span>
              </div>

              {!securityAvailable ? (
                <div className="empty-state">Security telemetry unavailable.</div>
              ) : (
                <div className="overview-check-list">
                  {checks.map((check) => (
                    <div className="overview-check-row" key={check.check}>
                      <div>
                        <strong>{String(check.check || "unknown").replaceAll("_", " ").toUpperCase()}</strong>
                        <span>{check.message || "Security check completed."}</span>
                      </div>
                      <span className={`overview-check-badge ${check.status}`}>
                        {String(check.status || "unknown").toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel overview-events-panel">
            <div className="panel-heading">
              <span>RECENT THREAT EVENTS</span>
              <span className="panel-tag">MODULE / 06</span>
            </div>

            {overview.alerts.length === 0 ? (
              <div className="empty-state">No active threat events recorded.</div>
            ) : (
              <div className="overview-event-list">
                {overview.alerts.slice(0, 5).map((alert) => (
                  <div className="overview-event-row" key={alert.id}>
                    <div className="overview-event-severity">
                      <span className={`overview-severity-dot ${String(alert.severity).toLowerCase()}`} />
                      <strong>{String(alert.severity || "unknown").toUpperCase()}</strong>
                    </div>

                    <div className="overview-event-message">
                      <strong>{alert.message}</strong>
                      <span>{alert.source || "unknown source"}</span>
                    </div>

                    <div className="overview-event-id">
                      EVENT #{alert.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overview-module-status panel">
            <div className="panel-heading">
              <span>MODULE STATUS</span>
              <span className="panel-tag">LIVE PIPELINE</span>
            </div>

            <div className="overview-module-grid">
              <div className={systemAvailable ? "module-online" : "module-offline"}>
                <span className="status-dot online" />
                <strong>01 / SYSTEM</strong>
                <span>{systemAvailable ? "ONLINE" : "OFFLINE"}</span>
              </div>
              <div className="module-ready">
                <span className="status-dot online" />
                <strong>02 / NETWORK</strong>
                <span>READY FOR SCAN</span>
              </div>
              <div className={processAvailable ? "module-online" : "module-offline"}>
                <span className="status-dot online" />
                <strong>03 / PROCESSES</strong>
                <span>{processAvailable ? "ONLINE" : "OFFLINE"}</span>
              </div>
              <div className={logsAvailable ? "module-online" : "module-offline"}>
                <span className="status-dot online" />
                <strong>04 / LOGS</strong>
                <span>{logsAvailable ? "ONLINE" : "OFFLINE"}</span>
              </div>
              <div className={securityAvailable ? "module-online" : "module-offline"}>
                <span className="status-dot online" />
                <strong>05 / SECURITY</strong>
                <span>{securityAvailable ? "ONLINE" : "OFFLINE"}</span>
              </div>
              <div className={alertsAvailable ? "module-online" : "module-offline"}>
                <span className="status-dot online" />
                <strong>06 / THREATS</strong>
                <span>{alertsAvailable ? "ONLINE" : "OFFLINE"}</span>
              </div>
            </div>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">DATA SOURCES</span>
              <span className="status-value">5 live backend telemetry endpoints</span>
            </div>
            <div>
              <span className="status-key">REFRESH</span>
              <span className="status-value">5 seconds</span>
            </div>
            <div>
              <span className="status-key">LAST UPDATE</span>
              <span className="status-value">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : "Waiting..."}
              </span>
            </div>
          </section>
        </>
      )}
    </>
  );
}

/* =========================================================
   PLACEHOLDER
   ========================================================= */

function PlaceholderPage({
  module,
  title,
  description,
}) {
  return (
    <section className="placeholder-page">
      <p className="section-label">
        {module}
      </p>

      <h1>{title}</h1>

      <p className="page-description">
        {description}
      </p>

      <div className="placeholder-panel">
        <div className="placeholder-icon">
          ◈
        </div>

        <div className="placeholder-title">
          MODULE INITIALIZATION
        </div>

        <div className="placeholder-text">
          This security module is part of the CyberSentinel architecture and will be connected to its backend telemetry pipeline next.
        </div>

        <div className="placeholder-status">
          STATUS: STANDBY
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN APPLICATION
   ========================================================= */

function App() {
  const [activePage, setActivePage] =
    useState("system");

  const [backendOnline, setBackendOnline] =
    useState(false);

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch(
          `${API_BASE}/health`
        );

        setBackendOnline(
          response.ok
        );
      } catch {
        setBackendOnline(false);
      }
    }

    checkBackend();

    const interval = setInterval(
      checkBackend,
      5000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const navigation = [
    {
      id: "overview",
      label: "OVERVIEW",
      module: "CORE",
    },
    {
      id: "system",
      label: "SYSTEM",
      module: "MODULE / 01",
    },
    {
      id: "network",
      label: "NETWORK",
      module: "MODULE / 02",
    },
    {
      id: "processes",
      label: "PROCESSES",
      module: "MODULE / 03",
    },
    {
      id: "logs",
      label: "LOGS",
      module: "MODULE / 04",
    },
    {
      id: "security",
      label: "SECURITY",
      module: "MODULE / 05",
    },
    {
      id: "threats",
      label: "THREATS",
      module: "MODULE / 06",
    },
  ];

  function renderPage() {
    switch (activePage) {
      case "overview":
        return <SecurityOverview />;

      case "system":
        return <SystemMonitor />;

      case "network":
        return <NetworkDashboard />;

      case "processes":
        return <ProcessMonitor />;

      case "logs":
        return <LogAnalyzer />;

      case "security":
        return <SecurityChecks />;

      case "threats":
        return <ThreatCenter />;

      default:
        return <SystemMonitor />;
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">
            CYBERSENTINEL
          </div>

          <div className="brand-subtitle">
            SECURITY MONITORING & THREAT ANALYSIS PLATFORM
          </div>
        </div>

        <div className="connection-status">
          <span
            className={
              backendOnline
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          {backendOnline
            ? "BACKEND CONNECTED"
            : "BACKEND OFFLINE"}
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-title">
            SECURITY CONSOLE
          </div>

          <nav>
            {navigation.map(
              (item) => (
                <button
                  key={item.id}
                  className={`nav-item ${
                    activePage === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePage(
                      item.id
                    )
                  }
                >
                  <span className="nav-indicator">
                    {activePage ===
                    item.id
                      ? "●"
                      : "○"}
                  </span>

                  <span>
                    <span className="nav-label">
                      {item.label}
                    </span>

                    <span className="nav-module">
                      {item.module}
                    </span>
                  </span>
                </button>
              )
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="engine-status">
              <span className="status-dot online" />
              THREAT ENGINE
            </div>

            <div className="engine-status">
              <span className="status-dot online" />
              DATABASE
            </div>

            <div className="engine-status">
              <span className="status-dot online" />
              API SERVER
            </div>
          </div>
        </aside>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
