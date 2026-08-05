import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Database, History, ScanLine, Settings, ShieldCheck, UserCircle, ChevronRight } from "lucide-react";
import { fetchUserHistory } from "../services/firestoreService";
import LoadingSkeleton from "../components/LoadingSkeleton";

const quickActions = [
  { title: "Scan Medicine", description: "Upload or scan a code", icon: ScanLine, to: "/scan" },
  { title: "Verify Medicine", description: "Check authenticity", icon: ShieldCheck, to: "/scan" },
  { title: "Report Fake Medicine", description: "Submit a report", icon: AlertTriangle, to: "/report" },
  { title: "Scan History", description: "Review previous scans", icon: History, to: "/history" },
  { title: "Medicine Database", description: "Browse verified medicines", icon: Database, to: "/database" },
  { title: "Profile", description: "Manage account", icon: UserCircle, to: "/profile" },
  { title: "Settings", description: "App preferences", icon: Settings, to: "/settings" },
];

export default function DashboardPage({ user, profile, onLogout, loading }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchUserHistory(user?.uid);
        setHistory(data.slice(0, 3));
      } catch (error) {
        console.error(error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user?.uid]);

  const stats = useMemo(() => [
    { label: "Scans", value: history.length },
    { label: "Verified", value: history.filter((item) => item.result === "Verified Original").length },
    { label: "Reports", value: 0 },
  ], [history]);

  return (
    <div className="page-card dashboard-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>{profile?.name || user?.displayName || "There"}, your medicine checks are safe.</h2>
          <p className="dashboard-copy">Monitor authenticity, review scans, and report suspicious products in seconds.</p>
        </div>
        <button className="ghost-btn" type="button" onClick={onLogout} disabled={loading}>
          {loading ? "Signing out…" : "Logout"}
        </button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="grid-two">
        <div className="info-card">
          <div className="card-top-row">
            <strong>Recent scans</strong>
            <span className="pill-badge">Latest</span>
          </div>
          {historyLoading ? <LoadingSkeleton rows={2} /> : (
            <div className="card-stack compact-stack">
              {history.length ? history.map((item) => (
                <div key={item.id} className="history-chip">
                  <span>{item.medicineName}</span>
                  <strong>{item.result}</strong>
                </div>
              )) : <p className="muted">No scans yet. Start with the scanner.</p>}
            </div>
          )}
        </div>

        <div className="info-card">
          <div className="card-top-row">
            <strong>Quick access</strong>
            <span className="pill-badge">Ready</span>
          </div>
          <div className="action-grid">
            {quickActions.map(({ title, description, icon: Icon, to }) => (
              <a className="feature-card" key={title} href={to}>
                <div className="feature-icon">
                  <Icon size={18} />
                </div>
                <div className="feature-content">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <ChevronRight size={16} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
