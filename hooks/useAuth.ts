import { mmkvStorage } from "@/lib/asyncStorage";
import { queryClient } from "@/lib/queryClient";
import { User, UserRole } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      setAuth: (accessToken: string, refreshToken: string, user: User) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          role: user.role,
        });
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
        });
        queryClient.clear();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const useAuth = useAuthStore;
export default useAuthStore;
