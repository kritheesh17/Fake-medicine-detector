import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, AlertTriangle, ShieldX } from "lucide-react";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { fetchUserHistory } from "../services/firestoreService";

const FILTERS = [
  { key: "all", label: "All Scans", tone: "" },
  { key: "Verified Original", label: "Verified", tone: "verified" },
  { key: "Needs Review", label: "Needs Review", tone: "review" },
  { key: "Possible Fake Medicine", label: "Fake", tone: "fake" },
];

function statusMeta(result) {
  if (result === "Verified Original") {
    return { chipClass: "verified", icon: ShieldCheck, label: "Verified" };
  }
  if (result === "Possible Fake Medicine") {
    return { chipClass: "fake", icon: ShieldX, label: "Fake" };
  }
  return { chipClass: "review", icon: AlertTriangle, label: "Needs Review" };
}

function groupLabel(date) {
  if (!date) return "Earlier";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return "Today";
  if (entryDay.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchUserHistory(user?.uid);
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.uid]);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.result === activeFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.medicineName?.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [history, activeFilter, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((item) => {
      const date = item.scannedAt?.toDate ? item.scannedAt.toDate() : null;
      const label = groupLabel(date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Your recent checks</p>
          <h2>History</h2>
        </div>
      </div>

      <label className="field search-field">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search medicine, batch, etc..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </label>

      <div className="filter-tabs">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`filter-tab ${activeFilter === filter.key ? `active ${filter.tone}` : ""}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No scans match your search or filter yet.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([label, items]) => (
          <div key={label}>
            <p className="history-group-label">{label}</p>
            <div className="card-stack">
              {items.map((item) => {
                const meta = statusMeta(item.result);
                const Icon = meta.icon;
                return (
                  <div key={item.id} className="history-row">
                    <div className={`history-row-icon ${meta.chipClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="history-row-body">
                      <strong>{item.medicineName || "Unknown"}</strong>
                      <span>Batch: {item.barcode || "—"}</span>
                    </div>
                    <div className="history-row-meta">
                      <span className={`status-chip ${meta.chipClass}`}>{meta.label}</span>
                      <time>
                        {item.scannedAt?.toDate ? item.scannedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                      </time>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
