import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Dashboard from "../Dashboard";

const handleDeleteTeam = vi.fn(async () => true);

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("@/hooks/useDashboard.ts", () => ({
  useDashboard: () => ({
    userData: { name: "نورا", familyName: "تست", email: "test@example.test", phone: "" },
    teamData: {
      id: "1",
      name: "تیم تست",
      description: "",
      status: "draft",
      creator_id: 1,
      members: [{ id: "1", name: "نورا", familyName: "تست", email: "test@example.test", phone: "", role: "کاپیتان" }],
    },
    loading: false,
    teamLoading: false,
    invites: [],
    isCaptain: true,
    daysLeft: 1,
    notifications: [],
    fetchTeamData: vi.fn(),
    handleDeleteTeam,
    handleSubmitTeam: vi.fn(async () => true),
    handleUploadReceipt: vi.fn(async () => true),
    handleCancelInvite: vi.fn(async () => true),
    handleStartSubmitProcess: vi.fn(() => true),
  }),
}));

beforeEach(() => handleDeleteTeam.mockClear());

it("opens a confirmation dialog and confirms draft team deletion", async () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("tab", { name: "تیم من" }));
  fireEvent.click(screen.getByRole("button", { name: "حذف تیم" }));

  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText(/تیم تست/)).toBeInTheDocument();
  fireEvent.click(dialog.getByRole("button", { name: "حذف تیم" }));

  await waitFor(() => expect(handleDeleteTeam).toHaveBeenCalledTimes(1));
});
