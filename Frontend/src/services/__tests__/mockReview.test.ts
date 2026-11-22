import { beforeEach, expect, it, vi } from "vitest";
import * as admin from "../adminServices";
import * as teams from "../teamService";
import { loginService, registerService, verifyOtpLoginService, verifyOtpSignupService } from "../authService";
import { saveSession } from "../authSession";
import { readMockState, updateMockState } from "../mock/mockData";

vi.mock("../mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("../mock/helpers", async (original) => ({
  ...await original<typeof import("../mock/helpers")>(), delay: async () => {},
}));

async function signIn(alias: string) {
  const email = alias + "@example.test";
  await loginService({ email });
  const { data } = await verifyOtpLoginService({ email, code: "111111" });
  saveSession(data);
  return data;
}

function upload(file?: File | string) {
  const form = new FormData();
  if (file !== undefined) form.set("receipt", file);
  return form;
}

const sample = () => new File(["private file contents"], "private-name.pdf", { type: "application/pdf" });
const error = (status: number) => ({ response: { status } });
beforeEach(() => localStorage.clear());

it("shares the complete submission and payment lifecycle across role switches and reloads", async () => {
  const captain = await signIn("captain");
  const { data: team } = await teams.createTeamService({ name: "Review team", description: "" });
  const id = String(team.id);
  await teams.inviteUserService(id, { members: ["member-a", "member-b"].map(alias => ({
    email: alias + "@example.test", first_name: "Demo", last_name: "Guest",
    phone: "", national_code: "", tshirt_size: "", university: "",
  })) });
  const { data: invites } = await teams.getInvitesService(id);
  for (const invite of invites) {
    await signIn(invite.email.split("@")[0]);
    await teams.acceptInviteService(invite.token);
  }
  await expect(teams.submitTeamService(id)).rejects.toMatchObject(error(403));
  saveSession(captain);
  await teams.submitTeamService(id);
  await expect(teams.submitTeamService(id)).rejects.toMatchObject(error(409));
  vi.resetModules();
  const review = await import("../adminServices");
  await signIn("admin");
  expect(await review.fetchTeamsService()).toContainEqual(expect.objectContaining({ id: team.id, status: "submitted" }));
  await review.approveTeamService(team.id);
  expect(await review.fetchTeamsService()).toContainEqual(expect.objectContaining({ id: team.id, status: "waiting_for_payment" }));
  saveSession(captain);
  await teams.uploadReceiptService(id, upload(sample()));
  await expect(teams.uploadReceiptService(id, upload(sample()))).rejects.toMatchObject(error(409));
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "receipt_pending", receipt_image_url: "/mock-receipt.png" });
  await signIn("admin");
  const receipt = (await review.fetchPendingReceiptsService()).find(row => row.team_id === team.id)!;
  expect(receipt).toMatchObject({ status: "pending", uploaded_by_id: captain.id, receipt_image_url: "/mock-receipt.png" });
  expect(JSON.stringify(readMockState())).not.toMatch(/private-name|private file contents/);
  await review.verifyReceiptService(receipt.id, true, "approved demo");
  expect((await review.fetchPendingReceiptsService()).map(row => row.id)).not.toContain(receipt.id);
  expect(readMockState().receipts.find(row => row.id === receipt.id)).toMatchObject({ notes: "approved demo", status: "approved" });
  await expect(review.verifyReceiptService(receipt.id, false)).rejects.toMatchObject(error(409));
  saveSession(captain);
  vi.resetModules();
  const reloaded = await import("../teamService");
  expect(await reloaded.getTeamForDashboardService()).toMatchObject({ status: "accepted" });
  expect(await reloaded.getAllTeamStatusesService()).toContainEqual(expect.objectContaining({ teamId: team.id, paymentStatus: "verified" }));
});

it("requires a complete draft with no open unexpired invitations", async () => {
  await signIn("draft");
  await expect(teams.submitTeamService("10")).rejects.toMatchObject(error(409));
  updateMockState(state => {
    const draft = state.teams.find(team => team.id === 10)!;
    draft.members.push(...state.users.filter(user => ["member-a@example.test", "member-b@example.test"].includes(user.email)));
  });
  await expect(teams.submitTeamService("10")).rejects.toMatchObject(error(409));
  await teams.cancelInviteService("fixture-pending", "10");
  await teams.submitTeamService("10");
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "submitted" });
});

it("rejects a team submission and a separate uploaded receipt by their own IDs", async () => {
  await signIn("payment");
  await teams.uploadReceiptService("9", upload(new File(["png"], "preview.PNG")));
  await signIn("admin");
  await admin.rejectTeamService(7);
  await expect(admin.approveTeamService(7)).rejects.toMatchObject(error(409));
  await expect(admin.rejectTeamService(9)).rejects.toMatchObject(error(409));
  await expect(admin.verifyReceiptService(9, false)).rejects.toMatchObject(error(404));
  const receipt = (await admin.fetchPendingReceiptsService()).find(row => row.team_id === 9)!;
  await admin.verifyReceiptService(receipt.id, false, "unclear");
  expect(await admin.fetchPendingReceiptsService()).toHaveLength(1);
  expect(readMockState().receipts.find(row => row.id === receipt.id)).toMatchObject({ status: "rejected", notes: "unclear" });
  await signIn("payment");
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "rejected" });
  await signIn("submitted");
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "rejected" });
});

it("limits uploads to the payment-ready captain and validates the file before saving", async () => {
  await signIn("submitted");
  await expect(teams.uploadReceiptService("7", upload(sample()))).rejects.toMatchObject(error(409));
  await signIn("payment-a");
  await expect(teams.uploadReceiptService("9", upload(sample()))).rejects.toMatchObject(error(403));
  await signIn("payment");
  for (const file of [undefined, "text", new File([], "empty.png"), new File(["bad"], "bad.txt"),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg")]) {
    await expect(teams.uploadReceiptService("9", upload(file))).rejects.toMatchObject(error(400));
  }
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "waiting_for_payment" });
  expect(readMockState().receipts.some(row => row.team_id === 9)).toBe(false);
  await teams.uploadReceiptService("9", upload(new File([new Uint8Array(5 * 1024 * 1024)], "image", { type: "image/jpeg" })));
  expect(await teams.getTeamForDashboardService()).toMatchObject({ status: "receipt_pending" });
});

it("protects every admin read and write and includes newly verified accounts", async () => {
  const actions = [admin.fetchUsersService, admin.fetchTeamsService, admin.fetchPendingReceiptsService,
    () => admin.approveTeamService(7), () => admin.rejectTeamService(7), () => admin.verifyReceiptService(101, true)];
  for (const action of actions) await expect(action()).rejects.toMatchObject(error(401));
  await signIn("captain");
  for (const action of actions) await expect(action()).rejects.toMatchObject(error(403));
  const account = { first_name: "New", last_name: "Demo", email: "new@example.test", phone: "09123456789",
    national_code: "0000223333", tshirt_size: "M", university: "Demo" };
  await registerService(account);
  await verifyOtpSignupService({ email: account.email, code: "111111" });
  await signIn("admin");
  expect(await admin.fetchUsersService()).toContainEqual(expect.objectContaining({ email: account.email }));
  expect(await admin.fetchTeamsService()).toContainEqual(expect.objectContaining({ id: 7, status: "submitted" }));
  expect(await admin.fetchPendingReceiptsService()).toContainEqual(expect.objectContaining({ team_id: 8, receipt_image_url: "/mock-receipt.png" }));
});
