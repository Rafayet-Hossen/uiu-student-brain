import { Link, useLocation } from "react-router-dom";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../features/auth/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/planner", label: "Study Planner", icon: "📅" },
    { to: "/grades", label: "Grade Planner", icon: "🎓" },
    { to: "/tracker", label: "Study Tracker", icon: "⏱️" },
  ];

  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-brand">
            <span className="navbar-logo-icon">🎓</span>
            <span className="navbar-brand-text">
              Student<span className="navbar-brand-accent">Brain</span>
            </span>
          </Link>

          <nav className="navbar-nav" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  <span className="nav-link-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="navbar-right">
          {user && (
            <div className="user-profile-badge" title={user.email}>
              <div className="user-avatar">{getInitials(user.full_name)}</div>
              <span className="user-name">{user.full_name || user.email}</span>
            </div>
          )}

          <ThemeToggle />

          <Button variant="secondary" onClick={logout} className="logout-btn">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

