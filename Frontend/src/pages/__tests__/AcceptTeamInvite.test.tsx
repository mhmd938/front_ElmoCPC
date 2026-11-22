import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AcceptTeamInvite from "../AcceptTeamInvite";

vi.mock("@/services/teamService", () => ({
  acceptInviteService: vi.fn(),
  rejectInviteService: vi.fn(),
}));

describe("AcceptTeamInvite design shell", () => {
  it("renders the auth shell and corner logos", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/accept-invite?token=test-token"]}>
        <AcceptTeamInvite />
      </MemoryRouter>
    );

    expect(screen.getByText("دعوت به تیم")).toBeInTheDocument();
    expect(container.querySelector(".auth-page")).toBeInTheDocument();
    expect(container.querySelector(".auth-card")).toBeInTheDocument();
    expect(container.querySelectorAll(".corner-logo")).toHaveLength(2);
    expect(container.querySelector(".btn.btn-yellow")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-ghost")).toBeInTheDocument();
  });

  it("does not use the old background or hardcoded brand colors", () => {
    const source = readFileSync("src/pages/AcceptTeamInvite.tsx", "utf8");

    expect(source).not.toMatch(/BG\.png|#00274D|#FFD500|rounded-3xl/);
  });
});
