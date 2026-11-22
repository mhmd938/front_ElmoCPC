import useUserStore from "@/store/userStore/userStore";
import type { AuthUserWithTokens } from "@/types/authTypes";
import { USE_MOCKS } from "./mock/flags";

const key = (name: string) => USE_MOCKS ? `elmocpc:mock:${name}` : name;

export function getAccessToken(): string | null {
  return localStorage.getItem(key("access_token"));
}

export function saveSession(user: AuthUserWithTokens): void {
  localStorage.setItem(key("access_token"), user.access_token);
  localStorage.setItem(key("refresh_token"), user.refresh_token);
  useUserStore.getState().setAuth(user);
}

export function clearSession(): void {
  localStorage.removeItem(key("access_token"));
  localStorage.removeItem(key("refresh_token"));
  localStorage.removeItem(key("userData"));
  useUserStore.getState().clearAuth();
}

export function getWizardStorageKey(name: string): string {
  if (!USE_MOCKS) return name;
  const userId = useUserStore.getState().authUser?.id ?? "guest";
  return key(`wizard:${userId}:${name}`);
}

export function clearWizardDraft(): void {
  for (const field of ["teamId", "teamInfo", "member1", "member2", "currentStep"]) {
    localStorage.removeItem(getWizardStorageKey(field));
  }
}
