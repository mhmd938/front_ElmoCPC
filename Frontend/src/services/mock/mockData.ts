// src/services/mock/mockData.ts
//
// Versioned demo state shared by services on the current browser origin.

import type { TeamInvite } from "@/types/teamTypes";
import type { Receipt, Team as AdminTeam, User } from "../adminServices";
import type { AuthUserWithTokens, RegisterPayload } from "@/types/authTypes";
import { getAccessToken } from "../authSession";
import { mockError } from "./helpers";

/* ---------------------------------------------------------
   Magic values you can use to test UI states
   ---------------------------------------------------------
   - OTP code for an active challenge: 111111
   - Email that triggers a 409 on register: taken@elmocpc.ir
   - Team name that triggers a 409 on create: تیم تکراری
--------------------------------------------------------- */
export const MOCK_RECEIPT_URL = "/mock-receipt.png";
export const MAGIC_OTP = "111111";
export const MOCK_ERROR_EMAIL = "taken@elmocpc.ir";
export const MOCK_ERROR_TEAM_NAME = "تیم تکراری";

export type MockUser = User & { role: "participant" | "admin" };
export type OtpChallenge = { email: string; expiresAt: number } & (
  | { kind: "login" }
  | { kind: "signup"; payload: RegisterPayload }
);

export interface MockState {
  users: MockUser[];
  teams: AdminTeam[];
  invites: TeamInvite[];
  receipts: (Receipt & { notes?: string })[];
  challenges: OtpChallenge[];
  nextUserId: number;
  nextTeamId: number;
  nextInviteId: number;
  nextReceiptId: number;
}

const mockStateKey = "elmocpc:mock:v1";

function seedState(): MockState {
  const now = Date.now();
  const date = new Date(now).toISOString();
  const users: MockUser[] = [];
  function addUser(alias: string, name: string, role: MockUser["role"] = "participant") {
    const id = users.length + 1;
    const user: MockUser = {
      id, role, first_name: name, last_name: "آزمایشی", email: `${alias}@example.test`,
      phone: `0900000${String(id).padStart(4, "0")}`, tshirt_size: "M", university: "دانشگاه نمونه",
      student_number: String(400000 + id), national_code: String(id).padStart(10, "0"),
      email_verified: true, created_at: date, updated_at: date,
    };
    users.push(user);
    return user;
  }
  addUser("captain", "نورا");
  addUser("member-a", "علی");
  addUser("member-b", "سارا");
  addUser("member-c", "مهدی");
  addUser("admin", "مدیر", "admin");

  function team(id: number, alias: string, name: string, status: AdminTeam["status"]): AdminTeam {
    const captain = addUser(alias, "کیان");
    const members = [captain];
    if (status !== "draft") {
      members.push(addUser(`${alias}-a`, "رها"), addUser(`${alias}-b`, "بهنام"));
    }
    return {
      id, name, status, description: "تیم آزمایشی", creator_id: captain.id, createdAt: date,
      members: members.map(({ id, first_name, last_name, email, phone }) => ({
        id, first_name, last_name, email, phone,
      })),
    };
  }
  const draft = team(10, "draft", "پیش‌نویس", "draft");
  const pending = team(8, "receipt", "الگوریتم‌های شادی", "receipt_pending");
  const accepted = team(11, "accepted", "مدار", "accepted");
  const teams = [
    team(7, "submitted", "تیم کوانتوم", "submitted"), pending,
    team(9, "payment", "باینری", "waiting_for_payment"), draft,
    accepted, team(12, "rejected", "بردار", "rejected"),
  ];
  const receipts = [pending, accepted].map((t, index) => {
    const captain = t.members[0];
    t.receipt_image_url = MOCK_RECEIPT_URL;
    return {
      id: 101 + index, team_id: t.id, uploaded_by_id: captain.id,
      uploaded_by_name: `${captain.first_name} ${captain.last_name}`, receipt_image_url: t.receipt_image_url,
      status: t === pending ? "pending" : "approved", created_at: date,
    };
  });
  const invites = ["pending", "expired"].map((alias, index): TeamInvite => {
    const recipient = addUser(alias, "مهمان");
    const expires = new Date(now + (index === 0 ? 1 : -1) * 86_400_000).toISOString();
    return {
      id: index + 1, teamId: draft.id, first_name: recipient.first_name, last_name: recipient.last_name,
      email: recipient.email, token: `fixture-${alias}`, status: "pending",
      createdAt: new Date(now - 2 * 86_400_000).toISOString(), expiresAt: expires, expires_at: expires,
      invitedBy: draft.creator_id, data: null,
    };
  });
  return {
    users, teams, invites, receipts, challenges: [], nextUserId: users.length + 1,
    nextTeamId: 13, nextInviteId: 3, nextReceiptId: 103,
  };
}

export function readMockState(): MockState {
  const stored = localStorage.getItem(mockStateKey);
  if (stored !== null) return JSON.parse(stored);
  const state = seedState();
  localStorage.setItem(mockStateKey, JSON.stringify(state));
  return state;
}

export function updateMockState<T>(mutate: (state: MockState) => T): T {
  const stored = localStorage.getItem(mockStateKey);
  const state: MockState = stored === null ? seedState() : JSON.parse(stored);
  const result = mutate(state);
  localStorage.setItem(mockStateKey, JSON.stringify(state));
  return result;
}

export const mockAccessToken = (id: number) => `mock-access-${id}`;

export function requireMockUser(state: MockState): MockUser {
  const token = getAccessToken();
  const actor = state.users.find(user => mockAccessToken(user.id) === token);
  return actor ?? mockError(401, { message: "Sign in to continue" });
}

export function isMockAdmin(user: AuthUserWithTokens): boolean {
  return user.access_token === mockAccessToken(user.id) && user.access_token === getAccessToken() &&
    readMockState().users.some(account => account.id === user.id && account.role === "admin");
}
