export const dashboardTabs = [
  { id: "overview", label: "خانه", icon: "User" },
  { id: "team", label: "تیم من", icon: "Users" },
  { id: "schedule", label: "برنامه مسابقات", icon: "Calendar" },
  { id: "notifications", label: "اطلاعیه‌ها", icon: "Bell" },
  { id: "settings", label: "تنظیمات", icon: "Settings" },
] as const;

export type DashboardTabId = (typeof dashboardTabs)[number]["id"];
