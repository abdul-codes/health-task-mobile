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

// export const getBaseUrl = (): string => {
//   if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

//   const host =
//     Platform.OS === "android"
//       ? (Constants.expoConfig?.hostUri?.split(":")[0] ?? "10.0.2.2")
//       : "localhost";
//   return `http://${host}:8000`;
// };
// lib/env.ts

export const getBaseUrl = (): string => {
  // For production/preview builds (EAS), always use the public API URL.
  // This environment variable MUST be set in your EAS build configuration.
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(
      "🔗 Using EXPO_PUBLIC_API_URL:",
      process.env.EXPO_PUBLIC_API_URL,
    );
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // The following logic is for DEVELOPMENT ONLY (running with `npx expo start`)
  if (__DEV__) {
    // 2. running inside Expo Go / dev-client?
    const hostUri = Constants.expoConfig?.hostUri; // e.g., "192.168.1.25:8081"
    const lanIp = hostUri?.split(":")[0];

    if (lanIp) {
      const url = `http://${lanIp}:8000`;
      console.log("🔗 Using LAN IP from Metro (DEV):", url);
      return url;
    }

    // 3. fallback for simulators / CI in DEV
    const fallbackHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    const url = `http://${fallbackHost}:8000`;
    console.log("🔗 Using fallback host (DEV):", url);
    return url;
  }

  // If we are in production and EXPO_PUBLIC_API_URL is not set, we have a problem.
  // Throw an error to make it clear that the configuration is missing.
  throw new Error("EXPO_PUBLIC_API_URL is not set for this production build.");
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
    const { accessToken } = useAuthStore.getState();
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
        const { data } = await axios.post(`${getBaseUrl()}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

        const user = useAuthStore.getState().user;

        if (!user) {
          useAuthStore.getState().logout();
          return Promise.reject(
            new Error("User not found during token refresh"),
          );
        }

        useAuthStore.getState().setAuth(newAccessToken, newRefreshToken, user);
        // update original request with new token and process queue as you already do

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
