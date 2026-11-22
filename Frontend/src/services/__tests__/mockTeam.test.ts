import { beforeEach, expect, it, vi } from "vitest";
import * as teams from "../teamService";
import { loginService, verifyOtpLoginService } from "../authService";
import { saveSession } from "../authSession";

vi.mock("../mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("../mock/helpers", async (original) => ({
  ...await original<typeof import("../mock/helpers")>(), delay: async () => {},
}));

const email = (alias: string) => alias + "@example.test";
async function signIn(alias: string) {
  const identity = { email: email(alias) };
  await loginService(identity);
  const user = (await verifyOtpLoginService({ ...identity, code: "111111" })).data;
  saveSession(user);
  return user;
}
const create = async (name = "Test") =>
  String((await teams.createTeamService({ name, description: "" })).data.id);
const invite = (teamId: string, ...emails: string[]) => teams.inviteUserService(teamId, {
  members: emails.map(email => ({
    email, first_name: "Guest", last_name: "Student", phone: "", national_code: "", tshirt_size: "", university: "",
  })),
});
const pending = async (id: string) => (await teams.getInvitesService(id)).data;
const status = (code: number) => ({ response: { status: code } });
beforeEach(() => localStorage.clear());

it("shares accepted membership between accounts and consumes a recipient-bound invitation", async () => {
  await signIn("captain");
  const id = await create();
  await invite(id, email("member-a"));
  const [link] = await pending(id);
  await signIn("member-b");
  await expect(teams.acceptInviteService(link.token)).rejects.toMatchObject(status(403));
  const recipient = await signIn("member-a");
  await teams.acceptInviteService(link.token);
  await expect(teams.rejectInviteService(link.token)).rejects.toMatchObject(status(409));
  expect(await teams.getTeamForDashboardService()).toMatchObject({ id, status: "draft" });
  await signIn("captain");
  expect(await pending(id)).toEqual([]);
  expect((await teams.getTeamService()).members[1]).toMatchObject({ id: recipient.id, email: recipient.email });
  expect(await teams.getAllTeamStatusesService()).toContainEqual(expect.objectContaining({ teamId: Number(id), memberCount: 2 }));
  await teams.removeMemberService(id, String(recipient.id));
  await signIn("member-a");
  expect(await teams.getTeamForDashboardService()).toBeNull();
  await expect(teams.getTeamService()).rejects.toMatchObject(status(404));
});

it("validates duplicate recipients and all occupied slots before saving a batch", async () => {
  await signIn("captain");
  const id = await create();
  await expect(invite(id, email("member-a"), email("MEMBER-A"))).rejects.toMatchObject(status(409));
  await expect(invite(id, email("member-a"), email("captain"))).rejects.toMatchObject(status(409));
  expect(await pending(id)).toHaveLength(0);
  await invite(id, email("member-a"), email("member-b"));
  await expect(invite(id, email("member-c"))).rejects.toMatchObject(status(409));
  const [a,b] = await pending(id);
  await teams.cancelInviteService(a.token, id);
  await signIn("member-a");
  await expect(teams.acceptInviteService(a.token)).rejects.toMatchObject(status(409));
  await signIn("member-b");
  await teams.rejectInviteService(b.token);
  expect(await teams.getTeamForDashboardService()).toBeNull();
  await signIn("captain");
  await invite(id, email("member-b"));
  const [replacement] = await pending(id);
  expect(replacement.token).not.toBe(b.token);
  await signIn("member-b");
  await teams.acceptInviteService(replacement.token);
  await teams.leaveTeamService(id);
  expect(await teams.getTeamForDashboardService()).toBeNull();
});

it("isolates captain mutations and removes dependent invites on delete/recreate", async () => {
  const captain = await signIn("captain");
  const id = await create();
  await invite(id, email("member-a"));
  const [link] = await pending(id);
  await expect(create("Another")).rejects.toMatchObject(status(409));
  await expect(teams.removeMemberService(id, String(captain.id))).rejects.toThrow();
  await signIn("member-c");
  await expect(create()).rejects.toMatchObject(status(409));
  const other = await create("Other");
  await expect(teams.deleteTeamService(id)).rejects.toMatchObject(status(403));
  await expect(invite(id, email("member-b"))).rejects.toMatchObject(status(403));
  await expect(teams.updateTeamService(other, { name: "Test" })).rejects.toMatchObject(status(409));
  await signIn("captain");
  await teams.deleteTeamService(id);
  expect(Number(await create())).toBeGreaterThan(Number(other));
  await signIn("member-a");
  await expect(teams.acceptInviteService(link.token)).rejects.toMatchObject(status(404));
});

it("ignores expired invitations in pending reads and rejects expired and missing links", async () => {
  await signIn("draft");
  expect((await pending("10")).map(item => item.email)).toEqual([email("pending")]);
  await invite("10", email("member-b"));
  await signIn("expired");
  await expect(teams.acceptInviteService("fixture-expired")).rejects.toMatchObject(status(410));
  await expect(teams.rejectInviteService("missing")).rejects.toMatchObject(status(404));
});
