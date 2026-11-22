import type { Team, User } from "../adminServices";
import { readMockState, requireMockUser, updateMockState, type MockState } from "./mockData";
import { delay, mockError } from "./helpers";

function requireAdmin(state: MockState) {
  if (requireMockUser(state).role !== "admin") {
    mockError(403, { message: "فقط مدیر مجاز به بررسی ثبت‌نام است" });
  }
  return state;
}

function findTeam(state: MockState, id: number) {
  return state.teams.find(team => team.id === id) ?? mockError(404, { message: "تیم یافت نشد" });
}

export async function verifyReceiptService(receiptId: number, approved: boolean, notes?: string): Promise<void> {
  await delay();
  updateMockState(state => {
    requireAdmin(state);
    const receipt = state.receipts.find(row => row.id === receiptId) ?? mockError(404, { message: "فیش یافت نشد" });
    const team = findTeam(state, receipt.team_id);
    if (receipt.status !== "pending" || team.status !== "receipt_pending") {
      mockError(409, { message: "این فیش در انتظار بررسی نیست" });
    }
    receipt.status = approved ? "approved" : "rejected";
    receipt.notes = notes;
    team.status = approved ? "accepted" : "rejected";
  });
}

export async function fetchPendingReceiptsService() {
  await delay();
  return requireAdmin(readMockState()).receipts.filter(receipt => receipt.status === "pending");
}

export async function fetchTeamsService(): Promise<Team[]> {
  await delay();
  return requireAdmin(readMockState()).teams;
}

async function reviewTeam(teamId: number, outcome: "waiting_for_payment" | "rejected") {
  await delay();
  updateMockState(state => {
    requireAdmin(state);
    const team = findTeam(state, teamId);
    if (team.status !== "submitted") mockError(409, { message: "این تیم در انتظار بررسی ثبت‌نام نیست" });
    team.status = outcome;
  });
}

export const approveTeamService = (teamId: number) => reviewTeam(teamId, "waiting_for_payment");
export const rejectTeamService = (teamId: number) => reviewTeam(teamId, "rejected");

export async function fetchUsersService(): Promise<User[]> {
  await delay();
  return requireAdmin(readMockState()).users;
}
