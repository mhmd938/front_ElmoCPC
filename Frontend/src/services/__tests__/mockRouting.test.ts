import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Receipt, Team as AdminTeam, User } from "../adminServices";
import type { VerifyOtpSuccessResponse } from "@/types/authTypes";
import type { TeamStatus } from "@/types/teamTypes";
import {
  deleteData,
  getData,
  postData,
  postImageData,
  putData,
} from "../services";

vi.mock("../services", () => ({
  getData: vi.fn(),
  postData: vi.fn(),
  putData: vi.fn(),
  deleteData: vi.fn(),
  postImageData: vi.fn(),
}));

const transports = [getData, postData, putData, deleteData, postImageData];

const teamFixture = {
  id: 7,
  name: "Fixture",
  description: "",
  status: "draft",
  creator_id: 42,
  members: [],
};

const receiptFixture: Receipt = {
  id: 28,
  team_id: 7,
  uploaded_by_id: 42,
  uploaded_by_name: "Fixture User",
  receipt_image_url: "/fixture-receipt.png",
  status: "pending",
  created_at: "2026-11-22T10:00:00Z",
};

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("DEV", true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("mock mode service routing", () => {
  const unexpectedFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("MODE", "mock");
    unexpectedFetch.mockRejectedValue(new Error("Unexpected network request"));
    vi.stubGlobal("fetch", unexpectedFetch);

    for (const transport of transports) {
      vi.mocked(transport).mockRejectedValue(new Error("Unexpected transport call"));
    }
  });

  afterEach(() => {
    for (const transport of transports) {
      expect(transport).not.toHaveBeenCalled();
    }

    expect(unexpectedFetch).not.toHaveBeenCalled();
  });

  it("forwards auth payloads and returns responses from the matching mock", async () => {
    const mockAuth = await import("../mock/mockAuth");
    const login = { email: "fixture@example.test" };
    const register = {
      ...login,
      first_name: "Fixture",
      last_name: "User",
      phone: "09120000000",
      national_code: "0123456789",
      tshirt_size: "M",
      university: "Fixture University",
    };
    const loginOtp = { email: login.email, code: "123456" };
    const signupOtp = { email: register.email, code: "234567" };
    const tokenData = {
      id: 42,
      first_name: register.first_name,
      last_name: register.last_name,
      email: login.email,
      phone: register.phone,
      access_token: "fixture-access",
      refresh_token: "fixture-refresh",
    };
    const loginResult = { status: 200, message: "Login OTP sent", data: null };
    const registerResult = { status: 200, message: "Signup OTP sent", data: null };
    const loginOtpResult: VerifyOtpSuccessResponse = {
      status: 200,
      message: "Logged in",
      data: tokenData,
    };
    const signupOtpResult: VerifyOtpSuccessResponse = {
      status: 201,
      message: "Signed up",
      data: { ...tokenData, id: 43 },
    };

    const loginMock = vi.spyOn(mockAuth, "loginService").mockResolvedValue(loginResult);
    const registerMock = vi.spyOn(mockAuth, "registerService").mockResolvedValue(registerResult);
    const loginOtpMock = vi.spyOn(mockAuth, "verifyOtpLoginService").mockResolvedValue(loginOtpResult);
    const signupOtpMock = vi.spyOn(mockAuth, "verifyOtpSignupService").mockResolvedValue(signupOtpResult);

    const auth = await import("../authService");
    await expect(auth.loginService(login)).resolves.toBe(loginResult);
    await expect(auth.registerService(register)).resolves.toBe(registerResult);
    await expect(auth.verifyOtpLoginService(loginOtp)).resolves.toBe(loginOtpResult);
    await expect(auth.verifyOtpSignupService(signupOtp)).resolves.toBe(signupOtpResult);
    expect(loginMock).toHaveBeenCalledExactlyOnceWith(login);
    expect(registerMock).toHaveBeenCalledExactlyOnceWith(register);
    expect(loginOtpMock).toHaveBeenCalledExactlyOnceWith(loginOtp);
    expect(signupOtpMock).toHaveBeenCalledExactlyOnceWith(signupOtp);
  });

  it("uses the dashboard mock without requesting the team over HTTP", async () => {
    vi.mocked(getData).mockResolvedValue({ data: teamFixture });
    const mockTeam = await import("../mock/mockTeam");
    const dashboardResult = { ...teamFixture, id: "71", name: "Dashboard fixture" };
    const dashboardMock = vi.spyOn(mockTeam, "getTeamForDashboardService").mockResolvedValue(dashboardResult);

    const { getTeamForDashboardService } = await import("../teamService");
    await expect(getTeamForDashboardService()).resolves.toBe(dashboardResult);
    expect(dashboardMock).toHaveBeenCalledExactlyOnceWith();
  });

  it("uses the team mocks for CRUD and statuses", async () => {
    const mockTeam = await import("../mock/mockTeam");
    const createPayload = { name: "Team to create", description: "Create description" };
    const updatePayload = { name: "Updated team" };
    const createResult = { status: 200, message: "Created", data: { ...teamFixture, ...createPayload } };
    const updateResult = { ...teamFixture, ...updatePayload };
    const statuses: TeamStatus[] = [
      { teamId: 7, teamName: "Status fixture", status: "draft", memberCount: 1, paymentStatus: "pending" },
    ];

    const createMock = vi.spyOn(mockTeam, "createTeamService").mockResolvedValue(createResult);
    const getMock = vi.spyOn(mockTeam, "getTeamService").mockResolvedValue(teamFixture);
    const updateMock = vi.spyOn(mockTeam, "updateTeamService").mockResolvedValue(updateResult);
    const deleteMock = vi.spyOn(mockTeam, "deleteTeamService").mockResolvedValue(undefined);
    const statusesMock = vi.spyOn(mockTeam, "getAllTeamStatusesService").mockResolvedValue(statuses);

    const team = await import("../teamService");
    await expect(team.createTeamService(createPayload)).resolves.toBe(createResult);
    await expect(team.getTeamService()).resolves.toBe(teamFixture);
    await expect(team.updateTeamService("7", updatePayload)).resolves.toBe(updateResult);
    await expect(team.deleteTeamService("8")).resolves.toBeUndefined();
    await expect(team.getAllTeamStatusesService()).resolves.toBe(statuses);
    expect(createMock).toHaveBeenCalledExactlyOnceWith(createPayload);
    expect(getMock).toHaveBeenCalledExactlyOnceWith();
    expect(updateMock).toHaveBeenCalledExactlyOnceWith("7", updatePayload);
    expect(deleteMock).toHaveBeenCalledExactlyOnceWith("8");
    expect(statusesMock).toHaveBeenCalledExactlyOnceWith();
  });

  it("forwards invitation and membership arguments to their matching mocks", async () => {
    const mockTeam = await import("../mock/mockTeam");
    const invitePayload = {
      members: [{
        first_name: "Invited",
        last_name: "User",
        email: "invited@example.test",
        phone: "09121111111",
        national_code: "1234567890",
        tshirt_size: "L",
        university: "Fixture University",
      }],
    };
    const invitesResult: Awaited<ReturnType<typeof mockTeam.getInvitesService>> = {
      status: 200,
      message: "Invites fixture",
      data: [],
    };
    const inviteMock = vi.spyOn(mockTeam, "inviteUserService").mockResolvedValue(undefined);
    const invitesMock = vi.spyOn(mockTeam, "getInvitesService").mockResolvedValue(invitesResult);
    const cancelMock = vi.spyOn(mockTeam, "cancelInviteService").mockResolvedValue(undefined);
    const removeMock = vi.spyOn(mockTeam, "removeMemberService").mockResolvedValue(undefined);
    const acceptMock = vi.spyOn(mockTeam, "acceptInviteService").mockResolvedValue(undefined);
    const rejectMock = vi.spyOn(mockTeam, "rejectInviteService").mockResolvedValue(undefined);
    const leaveMock = vi.spyOn(mockTeam, "leaveTeamService").mockResolvedValue(undefined);

    const team = await import("../teamService");
    await expect(team.inviteUserService("7", invitePayload)).resolves.toBeUndefined();
    await expect(team.getInvitesService("7")).resolves.toBe(invitesResult);
    await expect(team.cancelInviteService("cancel-token", "7")).resolves.toBeUndefined();
    await expect(team.removeMemberService("7", "42")).resolves.toBeUndefined();
    await expect(team.acceptInviteService("accept-token")).resolves.toBeUndefined();
    await expect(team.rejectInviteService("reject-token")).resolves.toBeUndefined();
    await expect(team.leaveTeamService("8")).resolves.toBeUndefined();
    expect(inviteMock).toHaveBeenCalledExactlyOnceWith("7", invitePayload);
    expect(invitesMock).toHaveBeenCalledExactlyOnceWith("7");
    expect(cancelMock).toHaveBeenCalledExactlyOnceWith("cancel-token", "7");
    expect(removeMock).toHaveBeenCalledExactlyOnceWith("7", "42");
    expect(acceptMock).toHaveBeenCalledExactlyOnceWith("accept-token");
    expect(rejectMock).toHaveBeenCalledExactlyOnceWith("reject-token");
    expect(leaveMock).toHaveBeenCalledExactlyOnceWith("8");
  });

  it("propagates a mock team rejection and sends the original FormData to the upload mock", async () => {
    const mockTeam = await import("../mock/mockTeam");
    const rejection = new Error("Team is incomplete");
    const submitMock = vi.spyOn(mockTeam, "submitTeamService").mockRejectedValue(rejection);
    const uploadMock = vi.spyOn(mockTeam, "uploadReceiptService").mockResolvedValue(undefined);
    const formData = new FormData();
    formData.set("receipt_image", new File(["fixture"], "receipt.png", { type: "image/png" }));

    const team = await import("../teamService");
    await expect(team.submitTeamService("7")).rejects.toBe(rejection);
    await expect(team.uploadReceiptService("8", formData)).resolves.toBeUndefined();
    expect(submitMock).toHaveBeenCalledExactlyOnceWith("7");
    expect(uploadMock).toHaveBeenCalledExactlyOnceWith("8", formData);
    expect(uploadMock.mock.calls[0][1]).toBe(formData);
  });

  it("uses the pending receipts mock without a token or direct fetch", async () => {
    const mockAdmin = await import("../mock/mockAdmin");
    const receiptRows = [receiptFixture];
    const pendingReceiptsMock = vi.spyOn(mockAdmin, "fetchPendingReceiptsService").mockResolvedValue(receiptRows);

    const admin = await import("../adminServices");
    await expect(admin.fetchPendingReceiptsService()).resolves.toBe(receiptRows);
    expect(pendingReceiptsMock).toHaveBeenCalledExactlyOnceWith();
  });

  it("uses the remaining admin mocks and forwards team and receipt changes", async () => {
    const mockAdmin = await import("../mock/mockAdmin");
    const teamRows: AdminTeam[] = [{ ...teamFixture, status: "submitted" }];
    const userRows: User[] = [{
      id: 42,
      first_name: "Fixture",
      last_name: "User",
      email: "fixture@example.test",
      phone: "09120000000",
      tshirt_size: "M",
      university: "Fixture University",
      student_number: "12345",
      national_code: "0123456789",
      email_verified: true,
      created_at: "2026-11-22T10:00:00Z",
      updated_at: "2026-11-22T10:00:00Z",
    }];

    const teamsMock = vi.spyOn(mockAdmin, "fetchTeamsService").mockResolvedValue(teamRows);
    const usersMock = vi.spyOn(mockAdmin, "fetchUsersService").mockResolvedValue(userRows);
    const approveMock = vi.spyOn(mockAdmin, "approveTeamService").mockResolvedValue(undefined);
    const rejectMock = vi.spyOn(mockAdmin, "rejectTeamService").mockResolvedValue(undefined);
    const verifyMock = vi.spyOn(mockAdmin, "verifyReceiptService").mockResolvedValue(undefined);

    const admin = await import("../adminServices");
    await expect(admin.fetchTeamsService()).resolves.toBe(teamRows);
    await expect(admin.fetchUsersService()).resolves.toBe(userRows);
    await expect(admin.approveTeamService(7)).resolves.toBeUndefined();
    await expect(admin.rejectTeamService(8)).resolves.toBeUndefined();
    await expect(admin.verifyReceiptService(28, false, "Unreadable image")).resolves.toBeUndefined();
    expect(teamsMock).toHaveBeenCalledExactlyOnceWith();
    expect(usersMock).toHaveBeenCalledExactlyOnceWith();
    expect(approveMock).toHaveBeenCalledExactlyOnceWith(7);
    expect(rejectMock).toHaveBeenCalledExactlyOnceWith(8);
    expect(verifyMock).toHaveBeenCalledExactlyOnceWith(28, false, "Unreadable image");
  });
});

describe("real mode service routing", () => {
  beforeEach(() => {
    vi.stubEnv("MODE", "development");
  });

  it("requests and maps the dashboard team through the backend transport", async () => {
    vi.mocked(getData).mockResolvedValue({ data: teamFixture });
    const { getTeamForDashboardService } = await import("../teamService");

    await expect(getTeamForDashboardService()).resolves.toMatchObject({ ...teamFixture, id: "7" });
    expect(getData).toHaveBeenCalledExactlyOnceWith({ endPoint: "/v1/user/teams" });
  });

  it("fetches and unwraps pending receipts with the saved token", async () => {
    localStorage.setItem("access_token", "fixture-access");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [receiptFixture] }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchPendingReceiptsService } = await import("../adminServices");

    await expect(fetchPendingReceiptsService()).resolves.toEqual([receiptFixture]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.elmocpc.ir/v1/admin/receipts/pending",
      {
        method: "GET",
        headers: { Authorization: "Bearer fixture-access", "Content-Type": "application/json" },
      },
    );
  });

  it("posts FormData to the real upload route with browser-managed multipart headers", async () => {
    localStorage.setItem("access_token", "fixture-access");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const realTransport = await vi.importActual<typeof import("../services")>("../services");
    vi.mocked(postImageData).mockImplementation(realTransport.postImageData);
    const formData = new FormData();
    formData.set("receipt_image", new File(["fixture"], "receipt.png", { type: "image/png" }));
    const { uploadReceiptService } = await import("../teamService");

    await uploadReceiptService("7", formData);
    expect(postImageData).toHaveBeenCalledExactlyOnceWith({
      endPoint: "/v1/user/teams/7/upload-receipt",
      data: formData,
    });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.elmocpc.ir/v1/user/teams/7/upload-receipt",
      { method: "POST", headers: { Authorization: "Bearer fixture-access" }, body: formData },
    );
  });
});

it("disables mock mode in a production build even when the mode is mock", async () => {
  vi.stubEnv("DEV", false);
  vi.stubEnv("MODE", "mock");

  expect((await import("../mock/flags")).USE_MOCKS).toBe(false);
});

it("throws a mock error with backend fields and the HTTP response shape", async () => {
  const { mockError } = await import("../mock/helpers");
  const messages = { team: { not_found: "Team not found" } };
  const call = async () => mockError(404, { message: "Team missing", messages });
  const error = await call().catch((reason: unknown) => reason);

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({
    status: 404,
    message: "Team missing",
    messages,
    data: null,
    response: {
      status: 404,
      data: { status: 404, message: "Team missing", messages, data: null },
    },
  });
});
