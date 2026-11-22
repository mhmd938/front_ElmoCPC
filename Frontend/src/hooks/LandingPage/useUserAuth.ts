// src/pages/LandingPage/hooks/useUserAuth.ts
import useUserStore from "@/store/userStore/userStore";
import { clearSession } from "@/services/authSession";

export const useUserAuth = () => {
  const { authUser } = useUserStore();
  const isLoggedIn = !!authUser;
  const displayName =
    authUser?.first_name || authUser?.email?.split("@")[0] || "کاربر";

  return {
    authUser,
    isLoggedIn,
    displayName,
    handleLogout: clearSession,
  };
};
