import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="medverify-shell">
        <div className="phone-frame auth-loading">
          <Loader2 size={28} className="spin" />
          <p>Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
