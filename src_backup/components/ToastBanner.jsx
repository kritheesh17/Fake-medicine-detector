export default function ToastBanner({ toast }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast-banner ${toast.type || "info"}`}>
      <strong>{toast.type === "success" ? "Success" : toast.type === "error" ? "Alert" : "Notice"}</strong>
      <span>{toast.message}</span>
    </div>
  );
}
