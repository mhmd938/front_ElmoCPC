import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Footer from "./Footer";
import Landing from "../../pages/Landing";

vi.mock("@/hooks/LandingPage/useCountdown", () => ({
  useCountdown: () => null,
}));
vi.mock("@/hooks/LandingPage/useUserAuth", () => ({
  useUserAuth: () => ({
    isLoggedIn: false,
    displayName: "",
    handleLogout: () => undefined,
  }),
}));
vi.mock("@/components/Landing/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Landing/HeroSection/HeroSection", () => ({ default: () => null }));
vi.mock("@/components/Landing/Sections/StatsSection", () => ({ default: () => null }));
vi.mock("@/components/Landing/Sections/FeaturesSection", () => ({ default: () => null }));
vi.mock("@/components/Landing/Sections/PrizesSection", () => ({ default: () => null }));
vi.mock("@/components/Landing/Sections/TimelineSection", () => ({ default: () => null }));
vi.mock("@/components/Landing/Sections/CTASection", () => ({ default: () => null }));

describe("Landing OpenMoji credits", () => {
  it("shows accessible creator, pinned artwork sources, and CC BY-SA license links", () => {
    render(<Landing />);

    const revision = "5acb7f049c45c57a98449122d470de9f09bb6794";
    const sourceBase = `https://github.com/hfg-gmuend/openmoji/blob/${revision}/color/svg`;

    expect(screen.getByRole("link", { name: "OpenMoji" })).toHaveAttribute(
      "href",
      "https://openmoji.org/",
    );
    expect(screen.getByRole("link", { name: "Bird (U+1F426)" })).toHaveAttribute(
      "href",
      `${sourceBase}/1F426.svg`,
    );
    expect(screen.getByRole("link", { name: "Owl (U+1F989)" })).toHaveAttribute(
      "href",
      `${sourceBase}/1F989.svg`,
    );
    expect(screen.getByRole("link", { name: "Duck (U+1F986)" })).toHaveAttribute(
      "href",
      `${sourceBase}/1F986.svg`,
    );
    expect(screen.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
    expect(document.querySelector("footer .footer-copy")).toContainElement(
      screen.getByRole("link", { name: "OpenMoji" }),
    );
  });

  it("keeps the shared footer free of optional credits when none are supplied", () => {
    render(<Footer />);

    expect(screen.queryByRole("link", { name: "OpenMoji" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "CC BY-SA 4.0" })).not.toBeInTheDocument();
  });
});
