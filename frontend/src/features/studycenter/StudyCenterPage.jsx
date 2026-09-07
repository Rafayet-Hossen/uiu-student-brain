import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import MaterialsPage from "../materials/MaterialsPage";
import PlannerPage from "../planner/PlannerPage";
import TrackerPage from "../tracker/TrackerPage";
import AnalyticsPage from "../analytics/AnalyticsPage";

export default function StudyCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "materials";

  const tabs = [
    {
      id: "materials",
      label: "Materials & AI Hub",
      icon: "📚",
      desc: "Semesters, courses, lecture slides, books, and AI tutor consultation",
    },
    {
      id: "planner",
      label: "Study Planner",
      icon: "📅",
      desc: "Interactive weekly calendar view, routines, and study blocks",
    },
    {
      id: "tracker",
      label: "Study Tracker & Rewards",
      icon: "⏱️",
      desc: "Session timer, habits, daily streaks, and achievement badges",
    },
    {
      id: "analytics",
      label: "Study Analytics",
      icon: "📈",
      desc: "Weekly volume, subject breakdown, and academic performance charts",
    },
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const activeTabMeta = tabs.find((t) => t.id === currentTab) || tabs[0];

  return (
    <div className="app-screen">
      <Navbar />

      <main className="main-content">
        <div className="study-center-wrapper">
          {/* Study Center Master Header */}
          <div className="study-center-top-header">
            <div className="study-center-title-group">
              <div className="study-center-badge-icon">🏛️</div>
              <div>
                <h1 className="study-center-main-title">Study Center</h1>
                <p className="study-center-tagline">
                  Your centralized academic workspace for curriculum materials, schedule planning, and performance intelligence.
                </p>
              </div>
            </div>

            {/* Sub-Nav Tab Switcher Bar */}
            <nav className="study-center-nav-tabs" aria-label="Study Center Modules">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`study-center-nav-tab ${isActive ? "study-center-tab-active" : ""}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <span className="tab-icon-emoji">{tab.icon}</span>
                    <span className="tab-label-text">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Tab View Body */}
          <div className="study-center-view-body">
            {currentTab === "materials" && <MaterialsPage />}
            {currentTab === "planner" && <PlannerPage />}
            {currentTab === "tracker" && <TrackerPage />}
            {currentTab === "analytics" && <AnalyticsPage />}
          </div>
        </div>
      </main>
    </div>
  );
}

