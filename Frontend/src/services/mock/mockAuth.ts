import type {
  LoginPayload, RegisterPayload, RegisterSuccessResponse, VerifyOtpPayload, VerifyOtpSuccessResponse,
} from "@/types/authTypes";
import {
  MAGIC_OTP, MOCK_ERROR_EMAIL, mockAccessToken, updateMockState,
  type MockState, type MockUser, type OtpChallenge,
} from "./mockData";
import { delay, mockError } from "./helpers";

const otpLifetime = 5 * 60_000;
const sent = (): RegisterSuccessResponse => ({ status: 200, message: "OTP sent to your email", data: null });

function issueChallenge(state: MockState, challenge: OtpChallenge) {
  state.challenges = state.challenges.filter(item =>
    item.expiresAt > Date.now() && !(item.kind === challenge.kind && item.email === challenge.email)
  );
  state.challenges.push(challenge);
}

function checkRegistration(state: MockState, payload: RegisterPayload) {
  const messages: Record<string, { "already exists": string }> = {};
  if (payload.email === MOCK_ERROR_EMAIL || state.users.some(user => user.email === payload.email)) {
    messages.email = { "already exists": "این ایمیل قبلاً ثبت شده است" };
  }
  if (state.users.some(user => user.phone === payload.phone)) {
    messages.phone = { "already exists": "این شماره موبایل قبلاً ثبت شده است" };
  }
  if (Object.keys(messages).length) mockError(409, { message: "Account already exists", messages });
}

export async function loginService(payload: LoginPayload): Promise<RegisterSuccessResponse> {
  await delay();
  const email = payload.email.trim().toLowerCase();
  updateMockState(state => {
    if (!state.users.some(user => user.email === email)) mockError(401, { message: "invalid email" });
    issueChallenge(state, { email, kind: "login", expiresAt: Date.now() + otpLifetime });
  });
  return sent();
}

export async function registerService(payload: RegisterPayload): Promise<RegisterSuccessResponse> {
  await delay();
  const email = payload.email.trim().toLowerCase();
  const normalized = { ...payload, email, phone: payload.phone.trim() };
  updateMockState(state => {
    checkRegistration(state, normalized);
    issueChallenge(state, { email, kind: "signup", payload: normalized, expiresAt: Date.now() + otpLifetime });
  });
  return sent();
}

async function verifyOtp(payload: VerifyOtpPayload, kind: OtpChallenge["kind"]): Promise<VerifyOtpSuccessResponse> {
  await delay();
  const email = payload.email.trim().toLowerCase();
  return updateMockState(state => {
    const challenge = state.challenges.find(item => item.email === email && item.kind === kind);
    if (!challenge || challenge.expiresAt <= Date.now() || payload.code.trim() !== MAGIC_OTP) {
      return mockError(404, { message: "OTP not found or expired" });
    }
    let user: MockUser;
    if (challenge.kind === "signup") {
      checkRegistration(state, challenge.payload);
      const date = new Date().toISOString();
      user = {
        ...challenge.payload, id: state.nextUserId++, role: "participant", student_number: "",
        email_verified: true, created_at: date, updated_at: date,
      };
      state.users.push(user);
    } else {
      user = state.users.find(item => item.email === email) ?? mockError(401, { message: "invalid email" });
    }
    state.challenges = state.challenges.filter(item => item !== challenge);
    const { id, first_name, last_name, phone } = user;
    return {
      status: kind === "signup" ? 201 : 200,
      message: kind === "signup" ? "account created successfully" : "login successful",
      data: { id, email, first_name, last_name, phone, access_token: mockAccessToken(id), refresh_token: `mock-refresh-${id}` },
    };
  });
}

export const verifyOtpSignupService = (payload: VerifyOtpPayload) => verifyOtp(payload, "signup");
export const verifyOtpLoginService = (payload: VerifyOtpPayload) => verifyOtp(payload, "login");
