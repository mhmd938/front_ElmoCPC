import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import AcceptTeamInvite from "../AcceptTeamInvite";

const { rejectInviteService } = vi.hoisted(() => ({
  rejectInviteService: vi.fn(),
}));

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: false }));
vi.mock("@/services/teamService", () => ({
  acceptInviteService: vi.fn(),
  rejectInviteService,
}));

beforeEach(() => {
  rejectInviteService.mockReset();
});

it("keeps the real-mode fallback for unknown structured reject errors", async () => {
  rejectInviteService.mockRejectedValue({
    messages: { invitation: ["پاسخ ساختاریافته سرویس"] },
  });

  render(
    <MemoryRouter initialEntries={["/accept-invite?token=test-token"]}>
      <AcceptTeamInvite />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "رد کردن" }));

  expect(await screen.findByText("پاسخ ساختاریافته سرویس")).toBeInTheDocument();
});
