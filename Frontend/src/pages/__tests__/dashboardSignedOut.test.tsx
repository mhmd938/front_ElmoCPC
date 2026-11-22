import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Dashboard from "../Dashboard";
import useUserStore from "@/store/userStore/userStore";

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));

beforeEach(() => {
  localStorage.clear();
  useUserStore.getState().clearAuth();
});

it("shows the signed-out card instead of spinning forever", async () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  expect(await screen.findByText("کاربر یافت نشد")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "بازگشت به ورود" })).toBeInTheDocument();
});
