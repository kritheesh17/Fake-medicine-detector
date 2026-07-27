import { useEffect, useState } from "react";
import { PlusCircle, Search } from "lucide-react";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { addMedicine, fetchMedicines } from "../services/firestoreService";

export default function DatabasePage({ profile }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    medicineName: "",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    manufactureDate: "",
    licenseNumber: "",
    barcode: "",
    description: "",
    dosage: "",
    imageURL: "",
    status: "verified",
  });
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const data = await fetchMedicines();
        setMedicines(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadMedicines();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await addMedicine(form);
      setMessage("Medicine added successfully.");
      setForm({
        medicineName: "",
        manufacturer: "",
        batchNumber: "",
        expiryDate: "",
        manufactureDate: "",
        licenseNumber: "",
        barcode: "",
        description: "",
        dosage: "",
        imageURL: "",
        status: "verified",
      });
      const data = await fetchMedicines();
      setMedicines(data);
    } catch (error) {
      setMessage("Unable to save the medicine right now.");
      console.error(error);
    }
  };

  const filteredMedicines = medicines.filter((item) =>
    [item.medicineName, item.manufacturer, item.barcode].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">Verified medicine catalog</p>
          <h2>Medicine database</h2>
        </div>
        <div className="pill-badge">Read only for users</div>
      </div>

      {message ? <div className="success-banner">{message}</div> : null}

      {profile?.role === "admin" ? (
        <form className="glass-form" onSubmit={handleSubmit}>
          <h3>Add medicine</h3>
          <div className="input-grid">
            <input placeholder="Medicine name" value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} />
            <input placeholder="Manufacturer" value={form.manufacturer} onChange={(event) => setForm({ ...form, manufacturer: event.target.value })} />
            <input placeholder="Batch number" value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} />
            <input placeholder="Barcode" value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
            <input placeholder="Expiry date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
            <input placeholder="Manufacture date" value={form.manufactureDate} onChange={(event) => setForm({ ...form, manufactureDate: event.target.value })} />
            <input placeholder="License number" value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} />
            <input placeholder="Dosage" value={form.dosage} onChange={(event) => setForm({ ...form, dosage: event.target.value })} />
            <input placeholder="Image URL" value={form.imageURL} onChange={(event) => setForm({ ...form, imageURL: event.target.value })} />
            <input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <button className="primary-btn" type="submit">
            <PlusCircle size={16} /> Add medicine
          </button>
        </form>
      ) : null}

      <label className="field search-field">
        <span>Search database</span>
        <div className="search-input">
          <Search size={16} />
          <input placeholder="Search by medicine or barcode" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </label>

      {loading ? <LoadingSkeleton rows={4} /> : (
        <div className="card-stack">
          {filteredMedicines.map((medicine) => (
            <div key={medicine.id} className="info-card">
              <div className="card-top-row">
                <strong>{medicine.medicineName}</strong>
                <span className="pill-badge">{medicine.status}</span>
              </div>
              <p>{medicine.description}</p>
              <div className="detail-grid compact">
                <div>
                  <span>Manufacturer</span>
                  <strong>{medicine.manufacturer}</strong>
                </div>
                <div>
                  <span>Batch</span>
                  <strong>{medicine.batchNumber}</strong>
                </div>
                <div>
                  <span>Barcode</span>
                  <strong>{medicine.barcode}</strong>
                </div>
                <div>
                  <span>Dosage</span>
                  <strong>{medicine.dosage}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
