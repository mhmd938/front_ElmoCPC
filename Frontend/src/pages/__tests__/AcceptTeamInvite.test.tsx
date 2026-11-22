import source from "../AcceptTeamInvite.tsx?raw";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AcceptTeamInvite from "../AcceptTeamInvite";

import { beforeEach } from "vitest";
vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
beforeEach(() => localStorage.setItem("elmocpc:mock:access_token", "mock-access-1"));
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
    expect(source).not.toMatch(/BG\.png|#00274D|#FFD500|rounded-3xl/);
  });
});

it("carries an anonymous visitor's complete token into login", async () => {
  localStorage.clear();
  function LoginDestination() {
    const [params] = useSearchParams();
    return <span>{params.get("invite")}</span>;
  }
  render(<MemoryRouter initialEntries={["/accept-invite?token=a%26b%2Fc"]}><Routes>
    <Route path="/accept-invite" element={<AcceptTeamInvite />} />
    <Route path="/login" element={<LoginDestination />} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("a&b/c")).toBeInTheDocument();
});
