import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";

describe("Dashboard sidebar", () => {
  it.each(["برنامه مسابقات", "اطلاعیه‌ها", "تنظیمات"])(
    "navigates to the %s tab",
    (label) => {
      const targetTab = {
        "برنامه مسابقات": "schedule",
        "اطلاعیه‌ها": "notifications",
        "تنظیمات": "settings",
      }[label];
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

      expect(setActiveTab).toHaveBeenCalledWith(targetTab);
      expect(tab).not.toHaveAttribute("aria-disabled", "true");
    }
  );

  it.each([
    ["overview", "team", "تیم من"],
    ["team", "overview", "خانه"],
  ] as const)("navigates from %s to %s", (activeTab, targetTab, label) => {
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

  it("closes after selecting a section at tablet widths", () => {
    const setSidebarOpen = vi.fn();
    const width = vi.spyOn(window, "innerWidth", "get").mockReturnValue(800);

    render(
      <Sidebar
        activeTab="overview"
        setActiveTab={vi.fn()}
        sidebarOpen
        setSidebarOpen={setSidebarOpen}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "تیم من" }));

    expect(setSidebarOpen).toHaveBeenCalledWith(false);
    width.mockRestore();
  });

  it("has an in-sidebar control to collapse the expanded sidebar", () => {
    const setSidebarOpen = vi.fn();

    render(
      <Sidebar
        activeTab="overview"
        setActiveTab={vi.fn()}
        sidebarOpen
        setSidebarOpen={setSidebarOpen}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "کوچک کردن منو" }));

    expect(setSidebarOpen).toHaveBeenCalledWith(false);
  });

  it("keeps collapsed navigation controls named", () => {
    render(
      <Sidebar
        activeTab="overview"
        setActiveTab={vi.fn()}
        sidebarOpen={false}
        setSidebarOpen={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "برنامه مسابقات" })).toBeInTheDocument();
  });
});
