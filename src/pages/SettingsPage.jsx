import { Moon, Bell, Languages, ShieldCheck, Info, LogOut } from "lucide-react";

export default function SettingsPage({ theme, toggleTheme, onLogout }) {
  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <p className="eyebrow">App preferences</p>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="card-stack">
        <button className="info-card settings-card" type="button" onClick={toggleTheme}>
          <div className="card-top-row">
            <strong>Dark mode</strong>
            <Moon size={18} />
          </div>
          <p>{theme === "dark" ? "Dark theme is active" : "Switch to dark mode for better night viewing"}</p>
        </button>

        <div className="info-card settings-card">
          <div className="card-top-row">
            <strong>Notifications</strong>
            <Bell size={18} />
          </div>
          <p>Receive updates about new safety checks and reports.</p>
        </div>

        <div className="info-card settings-card">
          <div className="card-top-row">
            <strong>Language</strong>
            <Languages size={18} />
          </div>
          <p>English · Available for future localization.</p>
        </div>

        <div className="info-card settings-card">
          <div className="card-top-row">
            <strong>About</strong>
            <Info size={18} />
          </div>
          <p>MedVerify helps communities verify medicine authenticity using AI guidance.</p>
        </div>

        <div className="info-card settings-card">
          <div className="card-top-row">
            <strong>Privacy policy</strong>
            <ShieldCheck size={18} />
          </div>
          <p>Your profile and reports are stored securely in Firebase.</p>
        </div>

        <button className="info-card settings-card danger" type="button" onClick={onLogout}>
          <div className="card-top-row">
            <strong>Logout</strong>
            <LogOut size={18} />
          </div>
          <p>Sign out of your MedVerify account.</p>
        </button>
      </div>
    </div>
  );
}
