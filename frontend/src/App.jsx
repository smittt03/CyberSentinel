import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function formatBytes(bytes) {
  if (!bytes) return "0 GB";

  const gb = bytes / (1024 ** 3);

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }

  return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span>{title}</span>
        <span className="metric-dot">●</span>
      </div>

      <div className="metric-value">{value}</div>
      <div className="metric-subtitle">{subtitle}</div>
    </div>
  );
}

function UsageBar({ label, percentage }) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100);

  return (
    <div className="usage-section">
      <div className="usage-header">
        <span>{label}</span>
        <span>{safePercentage.toFixed(1)}%</span>
      </div>

      <div className="usage-track">
        <div
          className="usage-fill"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}

function SystemMonitor() {
  const [system, setSystem] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function fetchSystemMetrics() {
    try {
      const response = await fetch(`${API_BASE}/api/system`);

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      setSystem(data);
      setConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("System monitor error:", error);
      setConnected(false);
    }
  }

  useEffect(() => {
    fetchSystemMetrics();

    const interval = setInterval(fetchSystemMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="section-label">MODULE / 01</p>
          <h1>SYSTEM MONITOR</h1>
          <p className="page-description">
            Real-time visibility into host resource utilization.
          </p>
        </div>

        <div className="live-indicator">
          <span className="pulse-dot" />
          LIVE MONITORING
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
              subtitle={`${formatBytes(system.memory.available_bytes)} available`}
            />

            <MetricCard
              title="DISK USAGE"
              value={`${system.disk.usage_percent.toFixed(1)}%`}
              subtitle={`${formatBytes(system.disk.free_bytes)} free`}
            />
          </section>

          <section className="monitor-grid">
            <div className="panel">
              <div className="panel-heading">
                <span>RESOURCE UTILIZATION</span>
                <span className="panel-tag">LIVE</span>
              </div>

              <UsageBar
                label="CPU"
                percentage={system.cpu.usage_percent}
              />

              <UsageBar
                label="MEMORY"
                percentage={system.memory.usage_percent}
              />

              <UsageBar
                label="DISK"
                percentage={system.disk.usage_percent}
              />
            </div>

            <div className="panel">
              <div className="panel-heading">
                <span>HOST INFORMATION</span>
                <span className="panel-tag">TELEMETRY</span>
              </div>

              <div className="info-row">
                <span>Logical Cores</span>
                <strong>{system.cpu.logical_cores}</strong>
              </div>

              <div className="info-row">
                <span>Physical Cores</span>
                <strong>{system.cpu.physical_cores}</strong>
              </div>

              <div className="info-row">
                <span>Total Memory</span>
                <strong>{formatBytes(system.memory.total_bytes)}</strong>
              </div>

              <div className="info-row">
                <span>Used Memory</span>
                <strong>{formatBytes(system.memory.used_bytes)}</strong>
              </div>

              <div className="info-row">
                <span>Total Disk</span>
                <strong>{formatBytes(system.disk.total_bytes)}</strong>
              </div>

              <div className="info-row">
                <span>Free Disk</span>
                <strong>{formatBytes(system.disk.free_bytes)}</strong>
              </div>
            </div>
          </section>

          <section className="footer-status">
            <div>
              <span className="status-key">TELEMETRY SOURCE</span>
              <span className="status-value">psutil / Linux host</span>
            </div>

            <div>
              <span className="status-key">REFRESH</span>
              <span className="status-value">5 seconds</span>
            </div>

            <div>
              <span className="status-key">LAST UPDATE</span>
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

function NetworkDashboard() {
  const [target, setTarget] = useState("127.0.0.1");
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error("Network scan request failed");
      }

      const data = await response.json();

      setResult(data);
    } catch (scanError) {
      console.error("Network scan error:", scanError);
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
          <p className="section-label">MODULE / 02</p>

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
          <span className="panel-tag">AUTHORIZED TARGETS ONLY</span>
        </div>

        <form className="scan-form" onSubmit={runNetworkScan}>
          <div className="target-field">
            <label htmlFor="network-target">
              TARGET
            </label>

            <input
              id="network-target"
              type="text"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="127.0.0.1"
              disabled={scanning}
            />
          </div>

          <button
            type="submit"
            className="scan-button"
            disabled={scanning}
          >
            {scanning ? "SCANNING..." : "START SCAN"}
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
              value={result.host_up ? "UP" : "DOWN"}
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
              <span>DISCOVERED SERVICES</span>
              <span className="panel-tag">
                {result.ports.length} RESULT
                {result.ports.length === 1 ? "" : "S"}
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
                    {result.ports.map((port) => (
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
                            ● {port.state.toUpperCase()}
                          </span>
                        </td>

                        <td>
                          {port.service || "unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="network-footer">
            <span>
              NMAP RETURN CODE: {result.return_code}
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

function PlaceholderPage({ module, title, description }) {
  return (
    <section className="placeholder-page">
      <p className="section-label">{module}</p>

      <h1>{title}</h1>

      <p className="page-description">{description}</p>

      <div className="placeholder-panel">
        <div className="placeholder-icon">◈</div>

        <div className="placeholder-title">
          MODULE INITIALIZATION
        </div>

        <div className="placeholder-text">
          This security module is part of the CyberSentinel architecture
          and will be connected to its backend telemetry pipeline next.
        </div>

        <div className="placeholder-status">
          STATUS: STANDBY
        </div>
      </div>
    </section>
  );
}

function App() {
  const [activePage, setActivePage] = useState("system");
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch(`${API_BASE}/health`);
        setBackendOnline(response.ok);
      } catch {
        setBackendOnline(false);
      }
    }

    checkBackend();

    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
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
      id: "threats",
      label: "THREATS",
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
  ];

  function renderPage() {
    switch (activePage) {
      case "system":
        return <SystemMonitor />;

      case "overview":
        return (
          <PlaceholderPage
            module="CORE / DASHBOARD"
            title="SECURITY OVERVIEW"
            description="Centralized view of CyberSentinel security telemetry."
          />
        );

      case "network":
  return <NetworkDashboard />;

      case "threats":
        return (
          <PlaceholderPage
            module="MODULE / 03"
            title="THREAT CENTER"
            description="Monitor active threats and security alerts."
          />
        );

      case "logs":
        return (
          <PlaceholderPage
            module="MODULE / 04"
            title="LOG ANALYZER"
            description="Inspect system logs and suspicious events."
          />
        );

      case "security":
        return (
          <PlaceholderPage
            module="MODULE / 05"
            title="SECURITY CHECKS"
            description="Review host security posture and detected conditions."
          />
        );

      default:
        return <SystemMonitor />;
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">CYBERSENTINEL</div>

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
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="nav-indicator">
                  {activePage === item.id ? "●" : "○"}
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
            ))}
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
