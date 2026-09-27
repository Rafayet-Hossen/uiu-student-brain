import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Timer,
  Trophy,
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
  const [expandedMenus, setExpandedMenus] = useState(() => ({
    "/study-center": true,
    "/community": true,
  }));

  const toggleExpand = (to, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedMenus((prev) => ({
      ...prev,
      [to]: !prev[to],
    }));
  };

  const dropdownRef = useRef(null);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      to: "/study-center",
      label: "Study Center",
      icon: BookOpen,
      subLinks: [
        {
          to: "/study-center?tab=materials",
          label: "Materials & Notes",
          icon: BookOpen,
        },
        {
          to: "/study-center?tab=planner",
          label: "Study Planner",
          icon: Calendar,
        },
        {
          to: "/study-center?tab=tracker",
          label: "Study Tracker & Rewards",
          icon: Timer,
        },
        {
          to: "/study-center?tab=analytics",
          label: "Study Analytics",
          icon: BarChart3,
        },
      ],
    },
    { to: "/grades", label: "Grade Planner", icon: GraduationCap },
    {
      to: "/community",
      label: "Community",
      icon: Users,
      subLinks: [
        {
          to: "/community?tab=posts",
          label: "Discussions & Feed",
          icon: MessageSquare,
        },
        {
          to: "/community?tab=network",
          label: "Student Directory",
          icon: Users,
        },
        {
          to: "/community?tab=events",
          label: "Events & Meetups",
          icon: Calendar,
        },
        {
          to: "/community?tab=leaderboard",
          label: "Scholar Leaderboard",
          icon: Trophy,
        },
      ],
    },
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

  const isLinkActive = (to) => {
    if (to === "/study-center") {
      return (
        location.pathname.startsWith("/study-center") ||
        location.pathname === "/materials" ||
        location.pathname === "/planner" ||
        location.pathname === "/tracker" ||
        location.pathname === "/analytics"
      );
    }
    return location.pathname === to;
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
              <img src="/logo.jpg" alt="StudentBrain Logo" className="navbar-brand-img" />
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
              const isActive = isLinkActive(link.to);
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
                            setProfileModalTab("settings");
                          }}
                        >
                          <User size={16} className="menu-option-icon" />
                          <span>Scholar Profile</span>
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
                          <span>Preferences & Settings</span>
                        </button>

                        <div className="dropdown-menu-separator" />

                        <button
                          type="button"
                          className="menu-option-btn text-danger"
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                        >
                          <LogOut size={16} className="menu-option-icon" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="guest-action-buttons">
                <Link to="/login" className="btn-guest-login">
                  Sign In
                </Link>
                <Link to="/register" className="btn-guest-register">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Drawer Trigger Hamburger */}
            <button
              type="button"
              className="mobile-hamburger-btn mobile-only"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile navigation"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="mobile-drawer-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header-row">
                <div className="drawer-brand-wrap">
                  <div className="navbar-brand-icon-box">
                    <img src="/logo.jpg" alt="StudentBrain Logo" className="navbar-brand-img" />
                  </div>
                  <span className="drawer-brand-title">
                    Student<span className="brand-accent-text">Brain</span>
                  </span>
                </div>

                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {user && (
                <div className="drawer-user-card">
                  <ScholarAvatar user={user} size={42} />
                  <div>
                    <strong className="drawer-user-name">
                      {user.full_name || "Scholar"}
                    </strong>
                    <span className="drawer-user-email">{user.email}</span>
                    {user.department && (
                      <span className="identity-dept-badge">
                        🎓 {user.department}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <nav className="drawer-links-nav">
                {navLinks.map((link) => {
                  const isActive = isLinkActive(link.to);
                  const Icon = link.icon;
                  const hasSub = Boolean(link.subLinks && link.subLinks.length > 0);
                  const isExpanded = Boolean(expandedMenus[link.to]);

                  if (!hasSub) {
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`drawer-nav-item ${
                          isActive ? "drawer-nav-active" : ""
                        }`}
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        <Icon size={18} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={link.to} className="drawer-accordion-group">
                      <div
                        className={`drawer-nav-item-wrapper ${
                          isActive ? "drawer-nav-active-parent" : ""
                        }`}
                      >
                        <Link
                          to={link.to}
                          className={`drawer-nav-item drawer-nav-link-part ${
                            isActive ? "drawer-nav-active" : ""
                          }`}
                          onClick={() => setMobileDrawerOpen(false)}
                        >
                          <Icon size={18} />
                          <span>{link.label}</span>
                        </Link>

                        <button
                          type="button"
                          className={`drawer-expand-arrow-btn ${
                            isExpanded ? "drawer-arrow-expanded" : ""
                          }`}
                          onClick={(e) => toggleExpand(link.to, e)}
                          aria-expanded={isExpanded}
                          aria-label={`Toggle ${link.label} submenu`}
                        >
                          <ChevronDown size={17} className="drawer-chevron-icon" />
                        </button>
                      </div>

                      {/* Submenu Accordion Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="drawer-sublinks-panel"
                          >
                            <div className="drawer-sublinks-list">
                              {link.subLinks.map((sub) => {
                                const isSubActive =
                                  location.pathname + location.search === sub.to ||
                                  (location.pathname === "/study-center" &&
                                    !location.search &&
                                    sub.to === "/study-center?tab=materials") ||
                                  (location.pathname === "/community" &&
                                    !location.search &&
                                    sub.to === "/community?tab=posts");
                                const SubIcon = sub.icon;
                                return (
                                  <Link
                                    key={sub.to}
                                    to={sub.to}
                                    className={`drawer-sublink-item ${
                                      isSubActive ? "drawer-sublink-active" : ""
                                    }`}
                                    onClick={() => setMobileDrawerOpen(false)}
                                  >
                                    <SubIcon
                                      size={15}
                                      className="drawer-sublink-icon"
                                    />
                                    <span className="drawer-sublink-text">
                                      {sub.label}
                                    </span>
                                    {isSubActive && (
                                      <span className="drawer-sublink-dot" />
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              <div className="drawer-footer-actions">
                {user ? (
                  <>
                    <button
                      type="button"
                      className="drawer-footer-btn"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        setProfileModalTab("profile");
                      }}
                    >
                      <User size={16} />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-footer-btn text-danger"
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="drawer-guest-btns">
                    <Link to="/login" className="btn-drawer-login">
                      Sign In
                    </Link>
                    <Link to="/register" className="btn-drawer-register">
                      Register Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile & Security Modal */}
      {profileModalTab && (
        <ProfileModal
          initialTab={profileModalTab}
          onClose={() => setProfileModalTab(null)}
        />
      )}
    </>
  );
}
