import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Dashboard from "../Dashboard";
import { clearSession, saveSession } from "@/services/authSession";
import { loginService, verifyOtpLoginService } from "@/services/authService";

vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("@/services/mock/helpers", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/mock/helpers")>(),
  delay: async () => {},
}));

beforeEach(() => {
  localStorage.clear();
  clearSession();
});

it("opens all dashboard panels and shows the signed-in seeded mock account", async () => {
  const email = "captain@example.test";
  await loginService({ email });
  const account = (await verifyOtpLoginService({ email, code: "111111" })).data;
  saveSession(account);

  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

  for (const [label, message] of [
    ["برنامه مسابقات", "برنامه مسابقات پس از نهایی شدن اعلام می‌شود."],
    ["اطلاعیه‌ها", "تشکیل تیم"],
  ]) {
    fireEvent.click(await screen.findByRole("tab", { name: label }));
    const panel = screen.getByRole("tabpanel", { name: label });
    expect(panel).toHaveTextContent(message);
    expect(screen.getByRole("tab", { name: label })).toHaveAttribute("aria-selected", "true");
  }

  fireEvent.click(screen.getByRole("tab", { name: "تنظیمات" }));
  const settingsPanel = screen.getByRole("tabpanel", { name: "تنظیمات" });
  expect(within(settingsPanel).getByText(`${account.first_name} ${account.last_name}`)).toBeInTheDocument();
  expect(within(settingsPanel).getByText(account.email)).toBeInTheDocument();
  expect(within(settingsPanel).getByText(account.phone)).toBeInTheDocument();
});
