import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

describe("Dashboard sidebar", () => {
  it.each(["برنامه مسابقات", "اطلاعیه‌ها", "تنظیمات"])(
    "keeps the unfinished %s tab inert",
    (label) => {
      const setActiveTab = vi.fn();

      render(
        <Sidebar
          activeTab="overview"
          setActiveTab={setActiveTab}
          sidebarOpen
          setSidebarOpen={vi.fn()}
          onLogout={vi.fn()}
        />
      );

      const tab = screen.getByRole("button", { name: label });
      fireEvent.click(tab);

      expect(setActiveTab).not.toHaveBeenCalled();
      expect(tab).toHaveAttribute("aria-disabled", "true");
    }
  );

  it.each([
    ["overview", "team", "تیم من"],
    ["team", "overview", "خانه"],
  ])("navigates from %s to %s", (activeTab, targetTab, label) => {
    const setActiveTab = vi.fn();

    render(
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen
        setSidebarOpen={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(setActiveTab).toHaveBeenCalledWith(targetTab);
  });
});
