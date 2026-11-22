import { beforeEach, expect, it, vi } from "vitest";
import { loginService, verifyOtpLoginService } from "../authService";
import { deleteTeamService, createTeamService } from "../teamService";
import { getWizardStorageKey, saveSession } from "../authSession";

vi.mock("../mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("../mock/helpers", async (original) => ({
  ...await original<typeof import("../mock/helpers")>(),
  delay: async () => {},
}));

beforeEach(() => localStorage.clear());

it("clears the captain's mock wizard draft when deleting a team", async () => {
  const identity = { email: "captain@example.test" };
  await loginService(identity);
  saveSession((await verifyOtpLoginService({ ...identity, code: "111111" })).data);
  const team = await createTeamService({ name: "Draft to remove", description: "" });

  localStorage.setItem(getWizardStorageKey("teamId"), String(team.data.id));
  localStorage.setItem(getWizardStorageKey("teamInfo"), "saved");
  localStorage.setItem(getWizardStorageKey("currentStep"), "2");

  await deleteTeamService(String(team.data.id));

  expect(localStorage.getItem(getWizardStorageKey("teamId"))).toBeNull();
  expect(localStorage.getItem(getWizardStorageKey("teamInfo"))).toBeNull();
  expect(localStorage.getItem(getWizardStorageKey("currentStep"))).toBeNull();
});
