import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icon";
import NotificationManager from "./NotificationManager";
import { useAppStore } from "../store/useAppStore";
import { useAuth } from "../store/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/habits", label: "Habits", icon: "habit" },
  { to: "/tasks", label: "Tasks", icon: "task" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/community", label: "Community", icon: "community" },
  { to: "/coach", label: "AI Coach", icon: "chat" },
  { to: "/nutrition", label: "Nutrition AI", icon: "nutrition" },
  { to: "/referral", label: "Refer a friend", icon: "refer" },
  { to: "/settings", label: "Settings", icon: "settings" }
];

function AppShell() {
  const { settings, toggleTheme, profile } = useAppStore();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = settings.theme === "dark";
  const displayName = profile.name || user?.firstName || "User";

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/sign-in", { replace: true });
  };

  return (
    <div className="app-shell">
      <NotificationManager />

      {/* Overlay */}
      {menuOpen && <div className="drawer-overlay" onClick={closeMenu} />}

      {/* Drawer sidebar */}
      <aside className={`sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">HF</div>
          <div>
            <h1 className="logo">HabitForge</h1>
            <p className="logo-sub">track · build · share</p>
          </div>
          <button className="drawer-close" onClick={closeMenu} aria-label="Close menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
              onClick={closeMenu}
            >
              <span className="nav-icon"><Icon name={item.icon} size={18} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="muted small">Signed in as {displayName}</p>
          <button className="nav-link" onClick={handleLogout} style={{ cursor: "pointer", border: "none", background: "none", color: "inherit", padding: "0.5rem 1rem" }}>
            <span className="nav-icon"><Icon name="close" size={18} /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
          <div className="topbar-title">
            <span className="brand-mark-sm">HF</span>
            <span className="logo-sm">HabitForge</span>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              title={`Switch to ${isDark ? "light" : "dark"} theme`}
            >
              <Icon name={isDark ? "sun" : "moon"} size={18} />
            </button>
            <NavLink className="avatar-chip" to="/profile/me" aria-label="Profile">
              {displayName?.[0]?.toUpperCase() || "U"}
            </NavLink>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
