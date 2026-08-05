import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Database,
  History,
  ScanLine,
  Settings,
  ShieldCheck,
  UserCircle,
  ChevronRight,
  CheckCircle2,
  ScanEye,
} from "lucide-react";
import { fetchUserHistory, fetchUserReports } from "../services/firestoreService";
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning!";
  if (hour < 17) return "Good Afternoon!";
  return "Good Evening!";
}

export default function DashboardPage({ user, profile, onLogout, loading }) {
  const [history, setHistory] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchUserHistory(user?.uid);
        setScanCount(data.length);
        setVerifiedCount(data.filter((item) => item.result === "Verified Original").length);
        setNeedsReviewCount(data.filter((item) => item.result === "Needs Review").length);
        setHistory(data.slice(0, 3));
      } catch (error) {
        console.error(error);
      } finally {
        setHistoryLoading(false);
      }
    };

    const loadReportCount = async () => {
      try {
        const reports = await fetchUserReports(user?.uid);
        setReportCount(reports.length);
      } catch (error) {
        console.error(error);
      }
    };

    loadHistory();
    loadReportCount();
  }, [user?.uid]);

  const stats = useMemo(() => [
    { label: "Verified", value: verifiedCount, icon: CheckCircle2, tone: "verified" },
    { label: "Needs Review", value: needsReviewCount, icon: AlertTriangle, tone: "review" },
    { label: "Total Scans", value: scanCount, icon: ScanEye, tone: "scans" },
  ], [scanCount, verifiedCount, needsReviewCount]);

  return (
    <div className="page-card dashboard-page">
      <div className="dashboard-greeting-row">
        <div>
          <p className="dashboard-greeting-name">
            Hi, {profile?.name || user?.displayName || "there"} 👋
          </p>
          <p className="dashboard-greeting-sub">{greeting()}</p>
        </div>
        <button className="ghost-btn" type="button" onClick={onLogout} disabled={loading}>
          {loading ? "…" : "Logout"}
        </button>
      </div>

      <section className="hero-card">
        <div>
          <p className="eyebrow">Verify medicines</p>
          <h2>Instantly protect your health.</h2>
          <p className="dashboard-copy">Monitor authenticity, review scans, and report suspicious products in seconds.</p>
          <Link to="/scan" className="primary-btn hero-scan-btn">
            <ScanLine size={16} /> Scan Medicine
          </Link>
        </div>
      </section>

      <p className="section-label">Today's Activity</p>
      <section className="stats-grid activity-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card tone-${stat.tone}`}>
            <div className="stat-icon">
              <stat.icon size={18} />
            </div>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <p className="section-label">Quick Actions</p>
      <section className="grid-two">
        <div className="info-card">
          <div className="action-grid">
            {quickActions.map(({ title, description, icon: Icon, to }) => (
              <Link className="feature-card" key={title} to={to}>
                <div className="feature-icon">
                  <Icon size={18} />
                </div>
                <div className="feature-content">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </div>

        <div className="info-card">
          <div className="card-top-row">
            <strong>Recent Scans</strong>
            <Link to="/history" className="pill-badge">View All</Link>
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
      </section>
    </div>
  );
}
