import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CTASection from "../CTASection";

describe("Landing bottom CTA", () => {
  it("shows the login button alongside signup and rules", () => {
    render(
      <CTASection
        isLoggedIn={false}
        onLogin={vi.fn()}
        onDashboard={vi.fn()}
        onRegister={vi.fn()}
        onScrollToRules={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /ورود/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ثبت‌نام/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مطالعه قوانین" })).toBeInTheDocument();
  });
});
