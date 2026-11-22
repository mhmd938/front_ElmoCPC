import type { CreateTeamPayload, CreateTeamSuccessResponse, Team as ParticipantTeam, GetInvitesSuccessResponse, InviteUserPayload, TeamStatus, UpdateTeamPayload } from "@/types/teamTypes";
import type { DashboardTeam } from "../teamService";
import type { Team } from "../adminServices";
import { clearWizardDraft } from "../authSession";
import { MOCK_RECEIPT_URL, MOCK_ERROR_TEAM_NAME, readMockState, requireMockUser, updateMockState, type MockState, type MockUser } from "./mockData";
import { delay, mockError } from "./helpers";

function fail(status: number, group: string, field: string, message: string): never {
  return mockError(status, { message, messages: { [group]: { [field]: message } } });
}

const normalized = (value: string) => value.trim().toLowerCase();
const memberOf = (state: MockState, id: number) =>
  state.teams.find(team => team.members.some(member => member.id === id));

function memberRecord({ id, first_name, last_name, email, phone }: MockUser) {
  return { id, first_name, last_name, email, phone };
}

function findTeam(state: MockState, id: string) {
  return state.teams.find(team => String(team.id) === id)
    ?? fail(404, "team", "not_found", "تیم یافت نشد");
}

function requireDraft(team: Team) {
  if (team.status !== "draft") fail(409, "team", "already_submitted", "تغییرات فقط در پیش‌نویس مجاز است");
}

function captainTeam(state: MockState, id: string, actor = requireMockUser(state)) {
  const team = findTeam(state, id);
  if (team.creator_id !== actor.id) fail(403, "team", "forbidden", "فقط کاپیتان تیم مجاز است");
  return team;
}

function editableTeam(state: MockState, id: string) {
  const team = captainTeam(state, id);
  requireDraft(team);
  return team;
}

function uniqueName(state: MockState, name: string, exceptId?: number) {
  if (!name.trim()) fail(400, "team", "invalid_name", "نام تیم الزامی است");
  if (name.trim() === MOCK_ERROR_TEAM_NAME || state.teams.some(team =>
    team.id !== exceptId && normalized(team.name) === normalized(name))) {
    fail(409, "team", "name_already_exists", "این نام تیم قبلاً استفاده شده است");
  }
  return name.trim();
}

function pendingInvites(state: MockState, teamId: number) {
  return state.invites.filter(invite => invite.teamId === teamId && invite.status === "pending"
    && Date.parse(invite.expires_at) > Date.now());
}

export async function getTeamForDashboardService(): Promise<DashboardTeam> {
  await delay();
  const state = readMockState();
  const team = memberOf(state, requireMockUser(state).id);
  if (!team) return null;
  return {
    ...team, id: String(team.id),
    members: team.members.map(member => ({
      id: String(member.id), name: member.first_name, familyName: member.last_name,
      email: member.email, phone: member.phone, role: member.id === team.creator_id ? "کاپیتان" : "عضو",
    })),
  };
}

export async function createTeamService(payload: CreateTeamPayload): Promise<CreateTeamSuccessResponse> {
  await delay();
  return updateMockState(state => {
    const actor = requireMockUser(state);
    if (memberOf(state, actor.id)) fail(409, "team", "user_already_has_team", "شما قبلاً یک تیم دارید");
    const team: Team = {
      id: state.nextTeamId++, name: uniqueName(state, payload.name), description: payload.description,
      creator_id: actor.id, status: "draft", createdAt: new Date().toISOString(), members: [memberRecord(actor)],
    };
    state.teams.push(team);
    return { status: 200, message: "team created successfully", data: team };
  });
}

export async function getTeamService(): Promise<ParticipantTeam> {
  await delay();
  const state = readMockState();
  return memberOf(state, requireMockUser(state).id) ?? fail(404, "team", "not_found", "تیم یافت نشد");
}

export async function updateTeamService(id: string, payload: UpdateTeamPayload): Promise<ParticipantTeam> {
  await delay();
  return updateMockState(state => {
    const team = editableTeam(state, id);
    if (payload.name !== undefined) team.name = uniqueName(state, payload.name, team.id);
    if (payload.description !== undefined) team.description = payload.description;
    return team;
  });
}

export async function deleteTeamService(id: string) {
  await delay();
  updateMockState(state => {
    const team = editableTeam(state, id);
    state.teams = state.teams.filter(item => item.id !== team.id);
    state.invites = state.invites.filter(item => item.teamId !== team.id);
  });
  clearWizardDraft();
}

export async function inviteUserService(id: string, payload: InviteUserPayload) {
  await delay();
  updateMockState(state => {
    const team = editableTeam(state, id);
    const pending = pendingInvites(state, team.id);
    const recipients = new Set(pending.map(invite => invite.email));
    if (team.members.length + pending.length + payload.members.length > 3) fail(409, "team", "full", "ظرفیت تیم تکمیل است");
    if (!payload.members.length) fail(400, "email", "invalid", "ایمیل الزامی است");
    for (const member of payload.members) {
      const email = normalized(member.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "email", "invalid", "ایمیل معتبر وارد کنید");
      if (recipients.has(email)) fail(409, "email", "already_invited", "این ایمیل قبلاً دعوت شده است");
      if (state.teams.some(team => team.members.some(m => normalized(m.email) === email))) {
        fail(409, "email", "already_in_team", "این کاربر عضو یک تیم است");
      }
      recipients.add(email);
    }
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 2 * 86_400_000).toISOString();
    for (const { first_name, last_name, email } of payload.members) {
      state.invites.push({
        id: state.nextInviteId++, first_name, last_name, email: normalized(email), token: crypto.randomUUID(),
        teamId: team.id, invitedBy: team.creator_id, status: "pending", createdAt, expiresAt, expires_at: expiresAt, data: null,
      });
    }
  });
}

export async function getInvitesService(id: string): Promise<GetInvitesSuccessResponse> {
  await delay();
  const state = readMockState();
  const team = captainTeam(state, id);
  return { status: 200, message: "invites retrieved successfully", data: pendingInvites(state, team.id) };
}

function requirePending(state: MockState, token: string, teamId?: number) {
  const invite = state.invites.find(item => item.token === token && (teamId === undefined || item.teamId === teamId));
  if (!invite) return fail(404, "invite", "not_found", "دعوت یافت نشد");
  if (invite.status !== "pending") fail(409, "invite", "already_processed", "این دعوت قبلاً بررسی شده است");
  if (Date.parse(invite.expires_at) <= Date.now()) fail(410, "invite", "expired", "این دعوت منقضی شده است");
  return invite;
}

export async function cancelInviteService(token: string, id: string) {
  await delay();
  updateMockState(state => {
    const team = editableTeam(state, id);
    requirePending(state, token, team.id).status = "cancelled";
  });
}

async function respondToInvite(token: string, outcome: "accepted" | "rejected") {
  await delay();
  updateMockState(state => {
    const actor = requireMockUser(state);
    const invite = requirePending(state, token);
    if (invite.email !== normalized(actor.email)) fail(403, "invite", "wrong_recipient", "این دعوت برای حساب شما نیست");
    const team = findTeam(state, String(invite.teamId));
    requireDraft(team);
    if (outcome === "accepted") {
      if (memberOf(state, actor.id)) fail(409, "team", "user_already_has_team", "شما قبلاً یک تیم دارید");
      if (team.members.length >= 3) fail(409, "team", "full", "ظرفیت تیم تکمیل است");
      team.members.push(memberRecord(actor));
      for (const other of state.invites) {
        if (other.id !== invite.id && other.email === invite.email && other.status === "pending") other.status = "cancelled";
      }
    }
    invite.status = outcome;
  });
}
export const acceptInviteService = (token: string) => respondToInvite(token, "accepted");
export const rejectInviteService = (token: string) => respondToInvite(token, "rejected");

function removeMember(team: Team, memberId: string) {
  const member = team.members.find(item => String(item.id) === memberId);
  if (!member) return fail(404, "member", "not_found", "عضو یافت نشد");
  if (member.id === team.creator_id) fail(409, "member", "cannot_remove_owner", "حذف کاپیتان مجاز نیست");
  team.members = team.members.filter(item => item.id !== member.id);
}

export async function removeMemberService(id: string, memberId: string) {
  await delay();
  updateMockState(state => removeMember(editableTeam(state, id), memberId));
}

export async function leaveTeamService(id: string) {
  await delay();
  updateMockState(state => {
    const actor = requireMockUser(state);
    const team = findTeam(state, id);
    requireDraft(team);
    removeMember(team, String(actor.id));
  });
}

export async function submitTeamService(teamId: string): Promise<void> {
  await delay();
  updateMockState(state => {
    const team = editableTeam(state, teamId);
    if (team.members.length !== 3) fail(409, "team", "incomplete", "برای ثبت نهایی تیم باید سه عضو داشته باشد");
    if (pendingInvites(state, team.id).length) fail(409, "team", "pending_invites", "تیم دعوت در انتظار پاسخ دارد");
    team.status = "submitted";
  });
}

export async function uploadReceiptService(teamId: string, formData: FormData): Promise<void> {
  await delay();
  updateMockState(state => {
    const actor = requireMockUser(state);
    const team = captainTeam(state, teamId, actor);
    if (team.status !== "waiting_for_payment") fail(409, "team", "payment_status", "تیم در انتظار پرداخت نیست");
    const file = formData.get("receipt");
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 ||
        !(["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type) || /\.(jpe?g|png|pdf)$/i.test(file.name))) {
      fail(400, "receipt", "invalid_file", "یک فایل JPG، PNG یا PDF تا ۵ مگابایت انتخاب کنید");
    }
    state.receipts.push({
      id: state.nextReceiptId++, team_id: team.id, uploaded_by_id: actor.id,
      uploaded_by_name: `${actor.first_name} ${actor.last_name}`, receipt_image_url: MOCK_RECEIPT_URL,
      status: "pending", created_at: new Date().toISOString(),
    });
    team.receipt_image_url = MOCK_RECEIPT_URL;
    team.status = "receipt_pending";
  });
}

const publicStatus: Record<Team["status"], TeamStatus["status"]> = {
  draft: "draft", submitted: "submitted", waiting_for_payment: "pending", receipt_pending: "pending",
  accepted: "active", rejected: "inactive",
};

export async function getAllTeamStatusesService(): Promise<TeamStatus[]> {
  await delay();
  const state = readMockState();
  return state.teams.map(team => {
    const receipt = state.receipts.find(item => item.team_id === team.id);
    return {
      teamId: team.id, teamName: team.name, status: publicStatus[team.status], memberCount: team.members.length,
      paymentStatus: receipt?.status === "approved" ? "verified" : receipt?.status === "pending" ? "paid" : "pending",
    };
  });
}
