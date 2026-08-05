import { NavLink, Outlet } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  ShieldCheck,
  SunMoon,
  User,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/database", label: "Database", icon: Database },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ user, profile, onLogout, theme, toggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-pill">
            <ShieldCheck size={18} />
            <span>MedVerify</span>
          </div>
          <button className="icon-btn" type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-user-card">
          <div className="avatar-circle">{(profile?.name || user?.email || "U").charAt(0).toUpperCase()}</div>
          <div>
            <strong>{profile?.name || "User"}</strong>
            <span>{profile?.role || "user"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} />
              {!collapsed ? <span>{label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="ghost-btn full-width" type="button" onClick={toggleTheme}>
            <SunMoon size={16} />
            {!collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : null}
          </button>
          <button className="ghost-btn full-width" type="button" onClick={onLogout}>
            <LogOut size={16} />
            {!collapsed ? "Logout" : null}
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="mobile-topbar">
          <div>
            <p className="eyebrow">AI Powered Medicine Safety</p>
            <h1>MedVerify</h1>
          </div>
          <button className="icon-btn" type="button" onClick={toggleTheme}>
            <SunMoon size={16} />
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>

        <nav className="bottom-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
