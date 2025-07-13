import useAuthStore from "@/hooks/useAuth";
import axios, { AxiosRequestConfig } from "axios";
import { Platform } from "react-native";

// Add this at the top
declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL:
    Platform.OS === "android"
      ? "http://192.168.0.3:8000"
      : "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
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
      __isRetryRequest?: boolean;
    }; // Handle specific error cases here
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
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

      originalRequest._retry   = true;
      isRefreshing = true;

      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

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

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
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
