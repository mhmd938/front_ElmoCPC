// src/pages/Dashboard/components/Sidebar/Sidebar.tsx
import { ChevronLeft, LogOut } from "lucide-react";
import MenuItem from "./menuItem";
import { dashboardTabs } from "../dashboardTabs";
import type { DashboardTabId } from "../dashboardTabs";

interface SidebarProps {
  activeTab: DashboardTabId;
  setActiveTab: (tab: DashboardTabId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
}: SidebarProps) => {
  return (
    <aside className={`sidebar${sidebarOpen ? "" : " is-collapsed"}`}>
      <div className="sidebar-head">
        <div className="sidebar-head-row">
          <div className="wordmark wordmark-sm">
            <span className="wm-elmo">ELMO</span>
            <span className="wm-c1">C</span>
            <span className="wm-p">P</span>
            <span className="wm-c2">C</span>
            <span className="wm-year"> 2026</span>
          </div>
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "کوچک کردن منو" : "باز کردن منو"}
            aria-expanded={sidebarOpen}
          >
            <ChevronLeft
              className={`icon${sidebarOpen ? " rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="بخش‌های داشبورد">
        {dashboardTabs.map((item) => (
          <MenuItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            activeTab={activeTab}
            sidebarOpen={sidebarOpen}
            onClick={() => {
              setActiveTab(item.id);
              if (window.innerWidth <= 900) setSidebarOpen(false);
            }}
          />
        ))}
      </nav>

      <div className="sidebar-foot">
        <button
          type="button"
          onClick={onLogout}
          className="sidebar-link sidebar-logout"
        >
          <LogOut className="icon" aria-hidden="true" />
          <span className="sidebar-label">خروج</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
