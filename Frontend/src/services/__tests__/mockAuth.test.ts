import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginService, registerService, verifyOtpLoginService, verifyOtpSignupService } from "../authService";
import { clearSession, saveSession } from "../authSession";
import { isMockAdmin, readMockState, requireMockUser } from "../mock/mockData";

vi.mock("../mock/flags", () => ({ USE_MOCKS: true }));
vi.mock("../mock/helpers", async (importOriginal) => ({
  ...await importOriginal<typeof import("../mock/helpers")>(),
  delay: async () => {},
}));

const signup = {
  email: "new@example.test", first_name: "Demo", last_name: "Student",
  phone: "09123456789", tshirt_size: "M", national_code: "0012345678", university: "Demo",
};
const otp = { email: signup.email, code: "111111" };
const missingOtp = { response: { status: 404 } };

describe("real-mode startup with credentials from the old demo", () => {
  it.each([
    ["mock-access-token", "mock-refresh-token", "mock-access-token", null, null, null],
    ["mock-access-token", "real-refresh", "real-access", null, "real-refresh", "real-access"],
    ["real-access", "real-refresh", "mock-access-token", "real-access", "real-refresh", null],
    ["real-access", "real-refresh", "real-access", "real-access", "real-refresh", "real-access"],
  ] as const)("migrates stored credentials (%s, %s, %s)", async (
    access, refresh, persisted, expectedAccess, expectedRefresh, expectedPersisted,
  ) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const user = { ...signup, id: 42, access_token: persisted, refresh_token: refresh };
    localStorage.setItem("auth-storage", JSON.stringify({ state: { authUser: user }, version: 0 }));
    vi.resetModules();
    vi.doMock("../mock/flags", () => ({ USE_MOCKS: false }));
    try {
      const { getAccessToken } = await import("../authSession");
      const store = (await import("@/store/userStore/userStore")).default;
      expect(getAccessToken()).toBe(expectedAccess);
      expect(localStorage.getItem("refresh_token")).toBe(expectedRefresh);
      expect(store.getState().authUser?.access_token ?? null).toBe(expectedPersisted);
    } finally {
      vi.doMock("../mock/flags", () => ({ USE_MOCKS: true }));
      vi.resetModules();
    }
  });
});

beforeEach(() => {
  localStorage.clear();
  clearSession();
});
afterEach(() => vi.useRealTimers());

describe("mock OTP accounts", () => {
  it("binds the signup challenge to its email and flow", async () => {
    await registerService(signup);
    await expect(verifyOtpSignupService({ ...otp, email: "other@example.test" })).rejects.toMatchObject(missingOtp);
    await expect(verifyOtpLoginService(otp)).rejects.toMatchObject(missingOtp);
    await expect(verifyOtpSignupService({ ...otp, code: "000000" })).rejects.toMatchObject(missingOtp);
    const account = (await verifyOtpSignupService(otp)).data;
    expect(account).toMatchObject({ email: signup.email, first_name: signup.first_name });
    expect(account.id).toEqual(expect.any(Number));
    await expect(verifyOtpSignupService(otp)).rejects.toMatchObject(missingOtp);
  });

  it("logs the same account in after a module reload and consumes each challenge once", async () => {
    await registerService(signup);
    const account = (await verifyOtpSignupService(otp)).data;
    saveSession(account);
    expect(requireMockUser(readMockState()).email).toBe(signup.email);
    clearSession();
    expect(() => requireMockUser(readMockState())).toThrow();
    vi.resetModules();
    const auth = await import("../authService");
    await auth.loginService({ email: " NEW@EXAMPLE.TEST " });
    await expect(auth.verifyOtpSignupService(otp)).rejects.toMatchObject(missingOtp);
    expect((await auth.verifyOtpLoginService(otp)).data).toEqual(account);
    await expect(auth.verifyOtpLoginService(otp)).rejects.toMatchObject(missingOtp);
  });

  it("keeps the mock actor, role and persistent session separate from real credentials", async () => {
    const realUser = {
      id: 901, first_name: "Real", last_name: "Fixture", email: "real@example.test", phone: "09120000002",
      access_token: "real-access", refresh_token: "real-refresh",
    };
    vi.resetModules();
    vi.doMock("../mock/flags", () => ({ USE_MOCKS: false }));
    try {
      const real = await import("../authSession");
      const realStore = (await import("@/store/userStore/userStore")).default;
      real.saveSession(realUser);
      const signupEmail = { email: "admin@example.test" };
      await loginService(signupEmail);
      const admin = (await verifyOtpLoginService({ ...signupEmail, code: "111111" })).data;
      expect(isMockAdmin(realUser)).toBe(false);
      saveSession(admin);
      expect(real.getAccessToken()).toBe(realUser.access_token);
      expect(localStorage.getItem("refresh_token")).toBe(realUser.refresh_token);
      expect(requireMockUser(readMockState()).role).toBe("admin");
      expect(isMockAdmin(admin)).toBe(true);

      vi.resetModules();
      expect((await import("@/store/userStore/userStore")).default.getState().authUser).toEqual(realUser);
      real.clearSession();
      expect(realStore.getState().authUser).toBeNull();
      expect(requireMockUser(readMockState()).id).toBe(admin.id);
      real.saveSession(realUser);
      clearSession();
      expect(isMockAdmin(admin)).toBe(false);
      expect(() => requireMockUser(readMockState())).toThrow();
      expect(real.getAccessToken()).toBe(realUser.access_token);
    } finally {
      vi.doMock("../mock/flags", () => ({ USE_MOCKS: true }));
      vi.resetModules();
    }
  });

  it("requires an existing verified user for login", async () => {
    await registerService(signup);
    await expect(loginService({ email: signup.email })).rejects.toMatchObject({ response: { status: 401 } });
    await expect(loginService({ email: "unknown@example.test" })).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("expires a challenge and lets an unverified signup request another one", async () => {
    vi.useFakeTimers();
    await registerService(signup);
    vi.setSystemTime(Date.now() + 86_400_000);
    await expect(verifyOtpSignupService(otp)).rejects.toMatchObject(missingOtp);
    await registerService({ ...signup, first_name: "Updated" });
    expect((await verifyOtpSignupService(otp)).data.first_name).toBe("Updated");
  });

  it("returns duplicate email and phone field errors, including overlapping pending registrations", async () => {
    await registerService(signup);
    const other = { ...signup, email: "other@example.test" };
    await registerService(other);
    await verifyOtpSignupService(otp);
    const phone = { "already exists": expect.any(String) };
    await expect(verifyOtpSignupService({ ...otp, email: other.email })).rejects.toMatchObject({
      response: { status: 409, data: { messages: { phone } } },
    });
    await expect(registerService({ ...signup, email: " NEW@EXAMPLE.TEST " })).rejects.toMatchObject({
      response: { status: 409, data: { messages: { email: { "already exists": expect.any(String) }, phone } } },
    });
  });
});
