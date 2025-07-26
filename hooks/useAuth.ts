//import api from '@/lib/api';
import api from '@/lib/api';
import { secureStorage } from '@/lib/itemStore';
import { registerForPushNotificationsAsync } from '@/lib/pushNotification';
import { queryClient } from '@/lib/queryClient';
import { User } from '@/lib/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
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
      setAuth: (accessToken: string, refreshToken: string, user: User) => {

      set({ user, accessToken, refreshToken, isAuthenticated: true });
      // register for push pushNotification after auth
      (async () => {
        const { accessToken } = get();
        if (accessToken) {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
              // Here you would call the mutation, but since we are outside a React component,
              // we'll need to call a function that can use the mutation.
              // For now, let's just log the token. We will wire this up in the next step.
              console.log('Got push token:', token);
              
              // You would typically do something like this:
              // const registerToken = useRegisterPushTokenMutation();
              // registerToken.mutate(token);
              // Since we can't use a hook here directly, let's just make the API call.
              await api.post('/users/push-token', { token }, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              console.log('Push token sent to server.');
            }
          } catch (e) {
            console.error('Error during push token registration:', e);
          }
        }
      })()
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        queryClient.clear()
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

export const useAuth = useAuthStore;
export default useAuthStore;