import source from "../inviteMember.tsx?raw";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BuildTeam from "../BuildTeam";
import InviteMember from "../inviteMember";

import { loginService, verifyOtpLoginService } from "@/services/authService";
import { useState } from "react";
import { useTeamRegistration } from "@/hooks/TeamRegistration/useTeamRegistration";
import { createTeamService, deleteTeamService } from "@/services/teamService";
import { getWizardStorageKey, saveSession } from "@/services/authSession";
import { readMockState } from "@/services/mock/mockData";
vi.mock("@/services/mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("@/services/mock/helpers", async original => ({
  ...await original<typeof import("@/services/mock/helpers")>(), delay: async () => {},
}));

describe("InviteMember design shell", () => {
  it("renders labeled design inputs and actions", () => {
    const { container } = render(
      <MemoryRouter>
        <InviteMember />
      </MemoryRouter>
    );

    expect(screen.getByText("دعوت عضو جدید")).toBeInTheDocument();
    expect(screen.getByLabelText("نام")).toBeInTheDocument();
    expect(screen.getByLabelText("نام خانوادگی")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    expect(screen.getByLabelText("ایمیل")).toHaveAttribute("dir", "ltr");
    expect(screen.getByLabelText("شماره موبایل")).toHaveAttribute("dir", "ltr");
    expect(container.querySelector(".auth-card.auth-card-2xl")).toBeInTheDocument();
    expect(container.querySelector(".form-grid")).toBeInTheDocument();
    expect(container.querySelector(".select")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-yellow")).toBeInTheDocument();
    expect(container.querySelector(".btn.btn-ghost")).toBeInTheDocument();
    expect(container.querySelectorAll(".corner-logo")).toHaveLength(2);
  });

  it("renders required-field errors outside the floating label wrappers", async () => {
    const { container } = render(
      <MemoryRouter>
        <InviteMember />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "ارسال دعوت" }));

    await screen.findByText("نام الزامی است");
    expect(container.querySelectorAll(".fl + .field-error")).toHaveLength(6);
  });

  it("does not use the old background or hardcoded brand colors", () => {
    expect(source).not.toMatch(/BG\.png|#00274D|#FFD500|rounded-3xl|CustomInput/);
  });
});

it("sends a standalone invite from the signed-in captain's team with no wizard draft", async () => {
  localStorage.clear();
  const email = "draft@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  const { container } = render(<MemoryRouter><InviteMember /></MemoryRouter>);
  const fields = { name: "Demo", familyName: "Student", email: "guest@example.test",
    phone: "09123456789", university: "Demo", nationalCode: "1234567890" };
  for (const [name, value] of Object.entries(fields)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
  fireEvent.click(screen.getByRole("button", { name: "ارسال دعوت" }));
  await waitFor(() => expect(readMockState().invites).toContainEqual(expect.objectContaining({
    email: fields.email, teamId: 10,
  })));
});

it("resumes the captain's own wizard and sends both invitations to its draft team", async () => {
  localStorage.clear();
  const email = "captain@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  const { data: team } = await createTeamService({ name: "Wizard team", description: "" });
  localStorage.setItem(getWizardStorageKey("teamId"), String(team.id));
  localStorage.setItem(getWizardStorageKey("currentStep"), "2");
  const hook = renderHook(() => {
    const [step, setStep] = useState(0);
    return { step, wizard: useTeamRegistration(step, setStep) };
  }, { wrapper: MemoryRouter });
  await waitFor(() => expect(hook.result.current.step).toBe(2));
  const member = { name: "Pat", familyName: "Demo", email: "member-a@example.test", phone: "09123456789", university: "Demo" };
  act(() => {
    hook.result.current.wizard.updateMember1(member);
    hook.result.current.wizard.updateMember2({ ...member, email: "member-b@example.test" });
  });
  await act(() => hook.result.current.wizard.handleFinalSubmit());
  expect(readMockState().invites.filter(i => i.teamId === team.id)).toHaveLength(2);
  await deleteTeamService(String(team.id));
  expect(localStorage.getItem(getWizardStorageKey("teamId"))).toBeNull();
});

it("discards a saved team ID and invitee details belonging to a different team", async () => {
  localStorage.clear();
  const email = "captain@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  localStorage.setItem(getWizardStorageKey("teamId"), "10");
  localStorage.setItem(getWizardStorageKey("member1"), JSON.stringify({ name: "Unrelated" }));
  const { result } = renderHook(() => {
    const [step, setStep] = useState(0);
    return useTeamRegistration(step, setStep);
  }, { wrapper: MemoryRouter });
  await waitFor(() => expect(localStorage.getItem(getWizardStorageKey("teamId"))).toBeNull());
  expect(result.current.member1.name).toBe("");
});

it("shows the restored draft name and description when reloading the team edit step", async () => {
  localStorage.clear();
  const email = "captain@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  const { data: team } = await createTeamService({ name: "Returning team", description: "Saved draft" });
  localStorage.setItem(getWizardStorageKey("teamId"), String(team.id));
  localStorage.setItem(getWizardStorageKey("currentStep"), "0");
  render(<MemoryRouter><BuildTeam /></MemoryRouter>);
  await waitFor(() => expect(screen.getByLabelText("نام تیم")).toHaveValue("Returning team"));
  expect(screen.getByLabelText("توضیحات تیم (اختیاری)")).toHaveValue("Saved draft");
});

it("lets a captain retry a rejected draft rename and advance after choosing a unique name", async () => {
  localStorage.clear();
  const email = "draft@example.test";
  await loginService({ email });
  saveSession((await verifyOtpLoginService({ email, code: "111111" })).data);
  localStorage.setItem(getWizardStorageKey("teamId"), "10");
  localStorage.setItem(getWizardStorageKey("currentStep"), "0");
  render(<MemoryRouter><BuildTeam /></MemoryRouter>);
  const name = await screen.findByRole("textbox", { name: "نام تیم" });
  const submit = screen.getByRole("button", { name: "ادامه" });
  fireEvent.change(name, { target: { value: "مدار" } });
  await act(async () => { fireEvent.click(submit); });
  expect(submit).toBeEnabled();
  expect(readMockState().teams.find(team => team.id === 10)?.name).toBe("پیش‌نویس");
  fireEvent.change(name, { target: { value: "Unique draft name" } });
  fireEvent.click(submit);
  await waitFor(() => expect(localStorage.getItem(getWizardStorageKey("currentStep"))).toBe("1"));
  expect(readMockState().teams.find(team => team.id === 10)?.name).toBe("Unique draft name");
});
