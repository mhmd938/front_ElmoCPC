// src/pages/Dashboard/components/Sidebar/MenuItem.tsx
import { Bell, Calendar, Settings, User, Users, type LucideIcon } from "lucide-react";

const iconsByName: Record<string, LucideIcon> = {
  User,
  Users,
  Calendar,
  Bell,
  Settings,
};

interface MenuItemProps {
  id: string;
  label: string;
  icon: string;
  activeTab: string;
  sidebarOpen: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const MenuItem = ({
  id,
  label,
  icon,
  activeTab,
  sidebarOpen,
  onClick,
  disabled = false,
}: MenuItemProps) => {
  const IconComponent = iconsByName[icon] ?? User;
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`sidebar-link${isActive ? " is-active" : ""}`}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
    >
      <IconComponent className="icon" aria-hidden="true" />
      {sidebarOpen && <span className="sidebar-label">{label}</span>}
    </button>
  );
};

export default MenuItem;
