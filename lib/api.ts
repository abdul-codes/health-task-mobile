import useAuthStore from "@/hooks/useAuth";
import axios, { AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Add this at the top
declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const host =
    Platform.OS === "android"
      ? (Constants.expoConfig?.hostUri?.split(":")[0] ?? "10.0.2.2")
      : "localhost";
  return `http://${host}:8000`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const {accessToken} = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let isLoggingOut = false; // prevents duplicate logout calls

// Fixed
type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    }; // Handle specific error cases here
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Avoid infinite loops
      originalRequest._retry = true; // new change

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) {
        if (!isLoggingOut) {
          isLoggingOut = true;
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        // const response = await axios.post(
        //        `${api.defaults.baseURL}/api/auth/refresh`,
        //        { refreshToken: currentRefreshToken }
        //      );
        const { data } = await axios.post<{
              accessToken: string;
              refreshToken: string;
            }>(`/api/auth/refresh`, { refreshToken: currentRefreshToken }, {
              baseURL: getBaseUrl(), // FIX: Ensure refresh call also uses the dynamic URL
            });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

        const user = useAuthStore.getState().user;

        if (user) {
          useAuthStore
            .getState()
            .setAuth(newAccessToken, newRefreshToken, user);
        } else {
          // Edge Case: If user is somehow null, logout to be safe
          useAuthStore.getState().logout();
          return Promise.reject(
            new Error("User not found during token refresh"),
          );
        }
        useAuthStore.getState().setAuth(newAccessToken, newRefreshToken, user!);

        // Update original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        // process queued requests
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
