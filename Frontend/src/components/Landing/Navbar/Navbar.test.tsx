import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Navbar from "./Navbar";

it("closes the compact navigation after selecting a section or pressing Escape", () => {
  const onScrollToSection = vi.fn();
  render(
    <Navbar
      isLoggedIn={false}
      displayName=""
      onLogin={vi.fn()}
      onRegister={vi.fn()}
      onDashboard={vi.fn()}
      onLogout={vi.fn()}
      onScrollToSection={onScrollToSection}
    />,
  );

  const menu = screen.getByRole("button", { name: "منوی اصلی" });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(menu);
  expect(menu).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("link", { name: "جدول زمانی" }));
  expect(onScrollToSection).toHaveBeenCalledWith("timeline");
  expect(menu).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(menu);
  const link = screen.getByRole("link", { name: "درباره مسابقه" });
  link.focus();
  fireEvent.keyDown(link, { key: "Escape" });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  expect(menu).toHaveFocus();

  fireEvent.click(menu);
  fireEvent.click(screen.getByRole("link", { name: /ELMOCPC/ }));
  expect(menu).toHaveAttribute("aria-expanded", "false");
});
