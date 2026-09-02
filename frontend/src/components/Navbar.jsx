import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Timer,
  User,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileModal from "../features/auth/components/ProfileModal";
import ScholarAvatar from "../features/auth/components/ScholarAvatar";
import { useAuth } from "../features/auth/useAuth";
import NotificationCenter from "./NotificationCenter";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/planner", label: "Planner", icon: Calendar },
    { to: "/grades", label: "Grades", icon: GraduationCap },
    { to: "/tracker", label: "Tracker", icon: Timer },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/materials", label: "Materials", icon: FileText },
    { to: "/community", label: "Community", icon: Users },
  ];

  // Detect scroll for floating glass shrink effect
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 15);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return "SB";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Floating Glass Desktop & Tablet Navbar */}
      <header
        className={`floating-navbar-container ${
          scrolled ? "navbar-scrolled" : ""
        }`}
      >
        <div className="navbar-inner-wrapper">
          {/* Left: Brand Logo */}
          <Link to="/dashboard" className="navbar-brand-logo">
            <div className="navbar-brand-icon-box">
              <GraduationCap size={20} className="brand-logo-svg" />
            </div>
            <span className="navbar-brand-name">
              Student<span className="brand-accent-text">Brain</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links with subtle pill animations */}
          <nav
            className="navbar-center-links desktop-only"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-pill-link ${isActive ? "nav-pill-active" : ""}`}
                >
                  <Icon size={16} className="nav-pill-icon" />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="nav-active-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Notifications, Theme Toggle & Profile Dropdown */}
          <div className="navbar-right-actions">
            <NotificationCenter />
            <ThemeToggle />

            {user ? (
              <div className="user-profile-dropdown-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-profile-trigger-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  title="Profile & Settings"
                >
                  <ScholarAvatar user={user} size={28} />
                  <span className="user-firstname-text desktop-only">
                    {user.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                </button>

                {/* Animated Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="user-floating-menu"
                    >
                      <div className="dropdown-user-identity">
                        <ScholarAvatar user={user} size={38} />
                        <div className="dropdown-identity-details">
                          <strong className="identity-fullname">
                            {user.full_name || "Scholar"}
                          </strong>
                          <span className="identity-email">{user.email}</span>
                          {user.department && (
                            <span className="identity-dept-badge">
                              🎓 {user.department}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="dropdown-menu-separator" />

                      <div className="dropdown-options-list">
                        <button
                          type="button"
                          className="menu-option-btn"
                          onClick={() => {
                            setDropdownOpen(false);
                            setProfileModalTab("profile");
                          }}
                        >
                          <User size={16} className="menu-option-icon" />
                          <span>Edit Profile & Bio</span>
                        </button>

                        <button
                          type="button"
                          className="menu-option-btn"
                          onClick={() => {
                            setDropdownOpen(false);
                            setProfileModalTab("performance");
                          }}
                        >
                          <BarChart3 size={16} className="menu-option-icon" />
                          <span>Performance & Rank</span>
                        </button>

                        <button
                          type="button"
                          className="menu-option-btn"
                          onClick={() => {
                            setDropdownOpen(false);
                            setProfileModalTab("settings");
                          }}
                        >
                          <Settings size={16} className="menu-option-icon" />
                          <span>Preferences</span>
                        </button>
                      </div>

                      <div className="dropdown-menu-separator" />

                      <button
                        type="button"
                        className="menu-option-btn menu-logout-btn"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                      >
                        <LogOut
                          size={16}
                          className="menu-option-icon text-rose"
                        />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {/* Mobile Menu Hamburger Trigger */}
            <button
              type="button"
              className="mobile-drawer-trigger mobile-tablet-only"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Navigation Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mobile-slide-drawer"
            >
              <div className="mobile-drawer-links-grid">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`mobile-drawer-card-link ${
                        isActive ? "mobile-drawer-active" : ""
                      }`}
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="mobile-drawer-bottom-row">
                  <button
                    type="button"
                    className="mobile-drawer-profile-btn"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setProfileModalTab("profile");
                    }}
                  >
                    <User size={16} />
                    <span>My Profile & Stats</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-drawer-logout-btn"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav-bar" aria-label="Mobile Navigation">
        {navLinks.slice(0, 5).map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-bottom-tab ${
                isActive ? "mobile-bottom-tab-active" : ""
              }`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
              {isActive && <div className="mobile-tab-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Scholar Profile & Performance Modal */}
      {profileModalTab && (
        <ProfileModal
          initialTab={profileModalTab}
          onClose={() => setProfileModalTab(null)}
        />
      )}
    </>
  );
}
