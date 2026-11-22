// src/pages/TeamRegistration/hooks/useTeamRegistration.ts
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createTeamService, getTeamService, inviteUserService, updateTeamService } from "@/services/teamService";
import useUserStore from "@/store/userStore/userStore";
import { USE_MOCKS } from "@/services/mock/flags";
import { clearWizardDraft, getAccessToken, getWizardStorageKey } from "@/services/authSession";
import type { CreateTeamPayload, InviteUserPayload } from "@/types/teamTypes";

interface TeamInfo {
  teamName: string;
  teamDescription: string;
}

interface MemberData {
  name: string;
  familyName: string;
  email: string;
  phone: string;
  university: string;
  nationalCode?: string;
  tshirtSize?: string;
}

export const useTeamRegistration = (
  currentStep: number,
  setCurrentStep: (step: number) => void
) => {
  const navigate = useNavigate();
  
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    teamName: "",
    teamDescription: "",
  });
  const [member1, setMember1] = useState<MemberData>({
    name: "",
    familyName: "",
    email: "",
    phone: "",
    university: "",
    nationalCode: "",
    tshirtSize: "M",
  });
  const [member2, setMember2] = useState<MemberData>({
    name: "",
    familyName: "",
    email: "",
    phone: "",
    university: "",
    nationalCode: "",
    tshirtSize: "M",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [restoring, setRestoring] = useState(USE_MOCKS);

  useEffect(() => {
    let active = true;
    const read = (field: string) => localStorage.getItem(getWizardStorageKey(field));
    async function restore() {
      const savedId = read("teamId");
      if (USE_MOCKS) {
        if (!savedId || !getAccessToken()) {
          clearWizardDraft();
          return;
        }
        const team = await getTeamService();
        if (!active) return;
        if (String(team.id) !== savedId || team.status !== "draft" ||
          team.creator_id !== useUserStore.getState().authUser?.id) {
          clearWizardDraft();
          return;
        }
        const step = Number(read("currentStep") ?? 1);
        setCurrentStep(Number.isInteger(step) && step >= 0 && step <= 3 ? step : 1);
        setTeamInfo({ teamName: team.name, teamDescription: team.description });
      } else {
        const info = read("teamInfo");
        if (info) setTeamInfo(JSON.parse(info));
      }
      const first = read("member1");
      const second = read("member2");
      if (savedId) setTeamId(Number(savedId));
      if (first) setMember1(JSON.parse(first));
      if (second) setMember2(JSON.parse(second));
    }
    restore().catch(() => { if (active && USE_MOCKS) clearWizardDraft(); })
      .finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, [setCurrentStep]);

  useEffect(() => {
    if (!USE_MOCKS || (!restoring && teamId)) {
      localStorage.setItem(getWizardStorageKey("currentStep"), currentStep.toString());
    }
  }, [currentStep, restoring, teamId]);

  const saveToLocalStorage = useCallback((key: string, data: unknown) => {
    localStorage.setItem(getWizardStorageKey(key), JSON.stringify(data));
  }, []);

  const handleCreateTeam = useCallback(async (values: TeamInfo) => {
    try {
      setIsSubmitting(true);

      const token = getAccessToken();
      if (!token) {
        toast.error("توکن یافت نشد. لطفا دوباره وارد شوید.");
        navigate("/login");
        return;
      }

      const teamPayload: CreateTeamPayload = {
        name: values.teamName,
        description: values.teamDescription,
      };

      const team = USE_MOCKS && teamId
        ? await updateTeamService(String(teamId), teamPayload)
        : (await createTeamService(teamPayload)).data;
      if (team?.id) {
        saveToLocalStorage("teamId", team.id);
        saveToLocalStorage("teamInfo", values);
        setTeamId(team.id);
        toast.success("تیم با موفقیت ایجاد شد!");
        setCurrentStep(1);
      } else {
        throw new Error("خطا در ایجاد تیم");
      }
    } catch (error: any) {
      console.error("Error creating team:", error);

      if (error?.messages?.team?.user_already_has_team) {
        toast.error("شما قبلاً یک تیم دارید");
        navigate("/dashboard");
      } else if (error?.messages?.team?.name_already_exists) {
        toast.error("این نام تیم قبلاً انتخاب شده است");
      } else if (error?.response?.data?.messages?.team) {
        toast.error(
          Object.values(error.response.data.messages.team)[0] as string
        );
      } else {
        toast.error(error?.message || "خطا در ایجاد تیم");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, saveToLocalStorage, setCurrentStep, teamId]);

  const handleMember1Submit = useCallback((values: MemberData) => {
    saveToLocalStorage("member1", values);
    toast.success("اطلاعات عضو دوم ذخیره شد!");
    setCurrentStep(2);
  }, [saveToLocalStorage, setCurrentStep]);

  const handleMember2Submit = useCallback((values: MemberData) => {
    saveToLocalStorage("member2", values);
    toast.success("اطلاعات عضو سوم ذخیره شد!");
    setCurrentStep(3);
  }, [saveToLocalStorage, setCurrentStep]);

  const handleFinalSubmit = useCallback(async () => {
    if (!teamId) {
      toast.error("تیم یافت نشد");
      return;
    }

    // Validate required fields
    const requiredFields = ["name", "familyName", "email", "phone", "university"];
    
    for (const member of [member1, member2]) {
      for (const field of requiredFields) {
        if (!member[field as keyof MemberData]) {
          toast.error(`لطفا اطلاعات ${getFieldLabel(field)} را کامل کنید`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const membersPayload: InviteUserPayload = {
        members: [
          {
            first_name: member1.name,
            last_name: member1.familyName,
            email: member1.email,
            phone: member1.phone,
            university: member1.university,
            national_code: member1.nationalCode || "",
            tshirt_size: member1.tshirtSize || "M",
          },
          {
            first_name: member2.name,
            last_name: member2.familyName,
            email: member2.email,
            phone: member2.phone,
            university: member2.university,
            national_code: member2.nationalCode || "",
            tshirt_size: member2.tshirtSize || "M",
          },
        ],
      };

      console.log("📨 دعوت اعضا:", membersPayload);
      await inviteUserService(teamId.toString(), membersPayload);

      toast.success(
        "اعضا دعوت شدند. پس از تایید اعضا نسبت به نهایی کردن تیم اقدام کنید"
      );

      if (USE_MOCKS) {
        clearWizardDraft();
      } else {
        localStorage.removeItem(getWizardStorageKey("member1"));
        localStorage.removeItem(getWizardStorageKey("member2"));
        localStorage.removeItem(getWizardStorageKey("currentStep"));
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("❌ خطا در تشکیل تیم:", error);

      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.error;
        toast.error(errorMessage || "خطا در اطلاعات وارد شده");
      } else {
        toast.error(
          error?.message || "خطا در تشکیل تیم. لطفا دوباره تلاش کنید"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [teamId, member1, member2, navigate]);

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: "نام",
      familyName: "نام خانوادگی",
      email: "ایمیل",
      phone: "شماره موبایل",
      university: "دانشگاه",
    };
    return labels[field] || field;
  };

  return {
    teamId,
    teamInfo,
    member1,
    member2,
    isSubmitting,
    restoring,
    handleCreateTeam,
    handleMember1Submit,
    handleMember2Submit,
    handleFinalSubmit,
    handleEditStep,
    updateTeamInfo: setTeamInfo,
    updateMember1: setMember1,
    updateMember2: setMember2,
  };
};
