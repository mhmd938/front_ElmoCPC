// src/stores/useProfileStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUserWithTokens } from "@/types/authTypes";
import { USE_MOCKS } from "@/services/mock/flags";

interface AuthState {
  authUser: AuthUserWithTokens | null;
  setAuth: (user: AuthUserWithTokens) => void;
  clearAuth: () => void;
}

function getAuthStorage(): Storage {
  const storage = localStorage;
  if (USE_MOCKS) return storage;

  // Earlier demo versions saved these fixed fixture tokens alongside API sessions.
  const legacyAccess = "mock-access-token";
  if (storage.getItem("access_token") === legacyAccess) storage.removeItem("access_token");
  if (storage.getItem("refresh_token") === "mock-refresh-token") storage.removeItem("refresh_token");
  const persisted = storage.getItem("auth-storage");
  if (persisted !== null) {
    try {
      if (JSON.parse(persisted)?.state?.authUser?.access_token === legacyAccess) {
        storage.removeItem("auth-storage");
      }
    } catch {
      // Zustand handles malformed persisted state during hydration.
    }
  }
  return storage;
}

const useUserStore = create<AuthState>()(
  persist(
    (set) => ({
      authUser: null,

      setAuth: (user) => set(() => ({ authUser: user })),

      clearAuth: () => set(() => ({ authUser: null })),
    }),
    {
      name: USE_MOCKS ? "elmocpc:mock:auth-storage" : "auth-storage",
      storage: createJSONStorage(getAuthStorage),
    }
  )
);

export default useUserStore;
