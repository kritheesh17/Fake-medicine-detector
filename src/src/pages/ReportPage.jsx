import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { addReport, uploadFile } from "../services/firestoreService";

export default function ReportPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const [form, setForm] = useState({
    medicineName: state.medicineName || "",
    barcode: state.barcode || "",
    description: "",
    location: "",
    imageURL: "",
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      let imageURL = "";
      if (file) {
        imageURL = await uploadFile(file, "reports");
      }

      await addReport({
        medicineName: form.medicineName,
        barcode: form.barcode,
        description: form.description,
        imageURL,
        location: form.location,
        uid: user?.uid || "",
        userEmail: user?.email || "unknown",
        status: "submitted",
      });

      setMessage("Report submitted successfully.");
      setTimeout(() => navigate("/history"), 1000);
    } catch (error) {
      console.error(error);
      setMessage("Unable to submit the report right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Community safety</p>
          <h2>Report fake medicine</h2>
        </div>
      </div>

      {message ? <div className="success-banner">{message}</div> : null}

      <form className="glass-form" onSubmit={handleSubmit}>
        <div className="input-grid">
          <input placeholder="Medicine name" value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} />
          <input placeholder="Barcode" value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <textarea placeholder="Describe the issue" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>

        <label className="upload-card wide">
          <UploadCloud size={18} />
          <span>{file ? file.name : "Upload evidence photo"}</span>
          <input type="file" accept="image/*" onChange={handleFileSelection} />
        </label>

        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
