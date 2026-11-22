// src/pages/Dashboard/components/Sidebar/MenuItem.tsx
import * as LucideIcons from "lucide-react";
import { type LucideIcon } from "lucide-react";

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
  const IconComponent = (LucideIcons as any)[icon] as LucideIcon;
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`sidebar-link${isActive ? " is-active" : ""}`}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
    >
      <IconComponent className="icon" aria-hidden="true" />
      {sidebarOpen && <span className="sidebar-label">{label}</span>}
    </button>
  );
};

export default MenuItem;
