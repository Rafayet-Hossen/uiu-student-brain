import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import MaterialsPage from "../materials/MaterialsPage";
import PlannerPage from "../planner/PlannerPage";
import TrackerPage from "../tracker/TrackerPage";
import AnalyticsPage from "../analytics/AnalyticsPage";
import ErrorBoundary from "../../components/ErrorBoundary";
import "./studycenter.css";

export default function StudyCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "materials";
  const navTabsRef = useRef(null);

  const tabs = [
    {
      id: "materials",
      label: "Materials & Notes",
      icon: BookOpen,
      desc: "Semesters, courses, lecture slides, notes, and study assistant",
      badge: "Curriculum Hub",
    },
    {
      id: "planner",
      label: "Study Planner",
      icon: Calendar,
      desc: "Interactive weekly calendar view, routines, and study blocks",
      badge: "Timetable Grid",
    },
    {
      id: "tracker",
      label: "Study Tracker",
      icon: Timer,
      desc: "Session timer, habits, daily streaks, and achievement badges",
      badge: "Focus & Streaks",
    },
    {
      id: "analytics",
      label: "Study Analytics",
      icon: BarChart3,
      desc: "Weekly volume, subject breakdown, and academic performance charts",
      badge: "Performance AI",
    },
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Smooth auto-scroll active tab into view when changed
  useEffect(() => {
    if (navTabsRef.current) {
      const activeEl = navTabsRef.current.querySelector(".study-center-tab-active");
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentTab]);

  const activeTabMeta = tabs.find((t) => t.id === currentTab) || tabs[0];

  return (
    <div className="app-screen study-center-screen">
      <Navbar />

      <main className="main-content study-center-main-content">
        <div className="study-center-wrapper">
          {/* Unified Study Center Command Ribbon */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="study-center-unified-header"
          >
            <div className="study-center-header-row">
              <div className="study-center-title-group">
                <div className="study-center-badge-icon">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="study-center-main-title">Study Center</h1>
                    <span className="study-center-micro-pill">
                      Academic Resource Hub
                    </span>
                  </div>
                  <p className="study-center-tagline">{activeTabMeta.desc}</p>
                </div>
              </div>

              {/* Module Switcher Segment Dock with Smooth Horizontal Scroll */}
              <div className="study-center-nav-scroll-wrapper">
                <nav
                  ref={navTabsRef}
                  className="study-center-nav-tabs"
                  aria-label="Study Center Modules"
                >
                  {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`study-center-nav-tab ${isActive ? "study-center-tab-active" : ""}`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeStudyCenterTabPill"
                            className="study-center-tab-pill-bg"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 32,
                            }}
                          />
                        )}
                        <span className="tab-content-inner">
                          <IconComponent size={15} className="tab-icon-svg" />
                          <span className="tab-label-text">{tab.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </motion.header>

          {/* Active Tab View Body with Smooth Transitions */}
          <div className="study-center-view-body">
            <ErrorBoundary key={currentTab}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {currentTab === "materials" && <MaterialsPage />}
                  {currentTab === "planner" && <PlannerPage />}
                  {currentTab === "tracker" && <TrackerPage />}
                  {currentTab === "analytics" && <AnalyticsPage />}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
