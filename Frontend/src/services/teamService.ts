// src/services/teamService.ts
// src/services/teamService.ts
import type {
  CreateTeamPayload,
  CreateTeamSuccessResponse,
  Team,
  UpdateTeamPayload,
  TeamInvite,
  TeamStatus,
  // AcceptRejectInvitePayload,
  InviteUserPayload
} from "@/types/teamTypes";

import { getData, postData, putData, deleteData, postImageData } from "./services";
import { USE_MOCKS } from "./mock/flags";
import {
  getTeamForDashboardService as mockGetTeamForDashboard,
  createTeamService as mockCreateTeam,
  getTeamService as mockGetTeam,
  updateTeamService as mockUpdateTeam,
  deleteTeamService as mockDeleteTeam,
  inviteUserService as mockInviteUser,
  getInvitesService as mockGetInvites,
  cancelInviteService as mockCancelInvite,
  removeMemberService as mockRemoveMember,
  acceptInviteService as mockAcceptInvite,
  rejectInviteService as mockRejectInvite,
  leaveTeamService as mockLeaveTeam,
  submitTeamService as mockSubmitTeam,
  uploadReceiptService as mockUploadReceipt,
  getAllTeamStatusesService as mockGetAllTeamStatuses,
} from "./mock/mockTeam";

// تایپ برای تیم در داشبورد
export type DashboardTeam = {
  id: string;
  name: string;
  description: string;
  status: string;
  creator_id: number;
  receipt_image_url?: string;
  members: {
    id: string;
    name: string;
    familyName: string;
    email: string;
    phone: string;
    role: string;
  }[];
} | null;

// تابع برای ترجمه status به فارسی
export const translateTeamStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'draft': 'پیش‌نویس',
    'submitted': 'ثبت شده',
    'waiting_for_payment': 'در انتظار پرداخت',
    'receipt_pending': 'در انتظار تایید فیش',
    'accepted': 'تایید شده',
    'rejected': 'رد شده'
  };
  return statusMap[status] || status;
};

export type TeamStatusPill =
  | "is-draft"
  | "is-submitted"
  | "is-waiting"
  | "is-receipt"
  | "is-accepted"
  | "is-rejected";

// تابع برای دریافت کلاس طراحی وضعیت
export const getStatusPillClass = (status: string): TeamStatusPill => {
  const pillMap: { [key: string]: TeamStatusPill } = {
    draft: "is-draft",
    submitted: "is-submitted",
    waiting_for_payment: "is-waiting",
    receipt_pending: "is-receipt",
    accepted: "is-accepted",
    rejected: "is-rejected",
  };
  return pillMap[status] || "is-draft";
};

// تابع برای دریافت وضعیت ثبت‌نام کاربر
export const getUserRegistrationStatus = (
  teamData: DashboardTeam | null
): { text: string; color: TeamStatusPill } => {
  if (!teamData) {
    return { text: "ثبت‌نام نشده", color: "is-rejected" };
  }

  const statusMap: { [key: string]: { text: string; color: TeamStatusPill } } = {
    draft: { text: "پیش‌نویس", color: "is-draft" },
    submitted: { text: "ثبت شده", color: "is-submitted" },
    waiting_for_payment: { text: "در انتظار پرداخت", color: "is-waiting" },
    receipt_pending: { text: "در انتظار تایید", color: "is-receipt" },
    accepted: { text: "تایید شده", color: "is-accepted" },
    rejected: { text: "رد شده", color: "is-rejected" },
  };

  return (
    statusMap[teamData.status] || {
      text: "نامشخص",
      color: "is-draft",
    }
  );
};

/* -----------------------------------------
   GET TEAM FOR DASHBOARD
   دریافت اطلاعات تیم برای نمایش در داشبورد
----------------------------------------- */
export const getTeamForDashboardService = async (): Promise<DashboardTeam> => {
  if (USE_MOCKS) return mockGetTeamForDashboard();
  try {
    const response = await getData({
      endPoint: "/v1/user/teams",
    });
    
    // مپ کردن داده‌های تیم به فرمت مورد نیاز داشبورد
    return {
      id: response.data.id.toString(),
      name: response.data.name,
      description: response.data.description,
      status: response.data.status,
      creator_id: response.data.creator_id,
      receipt_image_url: response.data.receipt_image_url,
      members: response.data.members?.map((member: any) => ({
        id: member.id.toString(),
        name: member.first_name,
        familyName: member.last_name,
        email: member.email,
        phone: member.phone,
        role: member.id === response.data.creator_id ? "کاپیتان" : "عضو"
      })) || []
    };
  } catch (error) {
    // اگر تیمی وجود نداشت، null برمی‌گردانیم
    if ((error as any).response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// ... بقیه سرویس‌ها بدون تغییر

/* -----------------------------------------
   CREATE TEAM
----------------------------------------- */
export const createTeamService = async (
  payload: CreateTeamPayload
): Promise<CreateTeamSuccessResponse> => {
  if (USE_MOCKS) return mockCreateTeam(payload);
  return postData({
    endPoint: "/v1/user/teams",
    data: payload,
  });
};

/* -----------------------------------------
   GET TEAM
----------------------------------------- */
export const getTeamService = async (): Promise<Team> => {
  if (USE_MOCKS) return mockGetTeam();
  return getData({
    endPoint: "/v1/user/teams",
  });
};

/* -----------------------------------------
   UPDATE TEAM
----------------------------------------- */
export const updateTeamService = async (
  teamId: string,
  payload: UpdateTeamPayload
): Promise<Team> => {
  if (USE_MOCKS) return mockUpdateTeam(teamId, payload);
  return putData({
    endPoint: `/v1/user/teams/${teamId}`,
    data: payload,
  });
};

/* -----------------------------------------
   DELETE TEAM
----------------------------------------- */
export const deleteTeamService = async (teamId: string): Promise<void> => {
  if (USE_MOCKS) return mockDeleteTeam(teamId);
  return deleteData({
    endPoint: `/v1/user/teams/${teamId}`,
  });
};

/* -----------------------------------------
   INVITE USER
----------------------------------------- */
export const inviteUserService = async (
  teamId: string,
  payload: InviteUserPayload
): Promise<void> => {
  if (USE_MOCKS) return mockInviteUser(teamId, payload);
  return postData({
    endPoint: `/v1/user/teams/${teamId}/invitations`,
    data: payload,
  });
};

/* -----------------------------------------
   GET INVITES
----------------------------------------- */
// در فایل teamService.ts
// در فایل teamService.ts
interface InvitesResponse {
  status: number;
  message: string;
  data: TeamInvite[];
}

export const getInvitesService = async (teamId: string): Promise<InvitesResponse> => {
  if (USE_MOCKS) return mockGetInvites(teamId);
  return getData({
    endPoint: `/v1/user/teams/${teamId}/invitations/pending`,
  });
};
/* -----------------------------------------
   CANCEL INVITE
----------------------------------------- */
export const cancelInviteService = async (invitetoken: string, inviteTeamid: string): Promise<void> => {
  if (USE_MOCKS) return mockCancelInvite(invitetoken, inviteTeamid);
  return deleteData({
    endPoint: `/v1/user/teams/${inviteTeamid}/invitations/${invitetoken}`,
  });
};

/* -----------------------------------------
   REMOVE MEMBER
----------------------------------------- */
export const removeMemberService = async (
  teamId: string,
  memberId: string
): Promise<void> => {
  if (USE_MOCKS) return mockRemoveMember(teamId, memberId);
  return deleteData({
    endPoint: `/v1/user/teams/${teamId}/members/${memberId}`,
  });
};

/* -----------------------------------------
   ACCEPT INVITE
----------------------------------------- */
export const acceptInviteService = async (token: string): Promise<void> => {
  if (USE_MOCKS) return mockAcceptInvite(token);
  return postData({
    endPoint: `/v1/invitations/accept-team`,
    data: { token }, // 👈 این مهمه
  });
};

/* -----------------------------------------
   REJECT INVITE
----------------------------------------- */
export const rejectInviteService = async (token: string): Promise<void> => {
  if (USE_MOCKS) return mockRejectInvite(token);
  return postData({
    endPoint: `/v1/invitations/reject-team`,
    data: { token }, // 👈 حتماً آبجکت باشه
  });
};


/* -----------------------------------------
   LEAVE TEAM
----------------------------------------- */
export const leaveTeamService = async (teamId: string): Promise<void> => {
  if (USE_MOCKS) return mockLeaveTeam(teamId);
  return postData({
    endPoint: `/v1/user/teams/${teamId}/leave`,
    data: {},
  });
};

/* -----------------------------------------
   SUBMIT TEAM
----------------------------------------- */
export const submitTeamService = async (teamId: string): Promise<void> => {
  if (USE_MOCKS) return mockSubmitTeam(teamId);
  return postData({
    endPoint: `/v1/user/teams/${teamId}/submit`,
    data: {},
  });
};

/* -----------------------------------------
   UPLOAD RECEIPT
----------------------------------------- */
export const uploadReceiptService = async (
  teamId: string,
  formData: FormData
): Promise<void> => {
  if (USE_MOCKS) return mockUploadReceipt(teamId, formData);
  return postImageData({
    endPoint: `/v1/user/teams/${teamId}/upload-receipt`,
    data: formData,
  });
};

/* -----------------------------------------
   GET ALL TEAM STATUSES
----------------------------------------- */
export const getAllTeamStatusesService = async (): Promise<TeamStatus[]> => {
  if (USE_MOCKS) return mockGetAllTeamStatuses();
  return getData({
    endPoint: "/v1/user/teams/statuses",
  });
};