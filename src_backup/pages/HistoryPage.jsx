import { useEffect, useState } from "react";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { fetchUserHistory } from "../services/firestoreService";

export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Your recent checks</p>
          <h2>Scan history</h2>
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={4} /> : (
        <div className="card-stack">
          {history.map((item) => (
            <div key={item.id} className="info-card">
              <div className="card-top-row">
                <strong>{item.medicineName}</strong>
                <span className="pill-badge">{item.result}</span>
              </div>
              <p>Barcode: {item.barcode}</p>
              <div className="detail-grid compact">
                <div>
                  <span>Scanned</span>
                  <strong>{item.scannedAt?.toDate ? item.scannedAt.toDate().toLocaleString() : "Recently scanned"}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
