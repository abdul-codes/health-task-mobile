import React, { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, View, ActivityIndicator, Text, StyleSheet, } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {PersistQueryClientProvider} from "@tanstack/react-query-persist-client";
import {createAsyncStoragePersister} from "@tanstack/query-async-storage-persister";
import { StatusBar } from "expo-status-bar";
import { Stack, SplashScreen, useSegments, useRouter } from "expo-router";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import api from "../lib/api";
import "../global.css";
import { asyncStoragePersister } from "@/lib/asyncStorage";
import { usePushNotifications } from "@/hooks/useNotification";
// import { mmkvStorage } from "@/lib/mmkvStorage";



// const mmkvAsyncPersister = createAsyncStoragePersister({
//   storage: mmkvStorage,
// });
const asyncStoragePerisiser = createAsyncStoragePersister({
  storage: asyncStoragePersister
})

//Error Boundary Fallback                                           */
const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorMessage}>
      {error.message || "An unexpected error occurred"}
    </Text>
    <Text style={styles.retryButton} onPress={resetErrorBoundary}>
      Try again
    </Text>
  </View>
);

// Navigation effect
// --- New Hook to handle protected routing ---
function useProtectedRoute(sessionState: SessionState) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === "(tabs)";

    // If the session is still loading, do nothing.
    if (sessionState === 'loading') return;

    if (sessionState === "authenticated" && !inTabsGroup) {
      // Redirect to the dashboard if the user is authenticated but not in the main app area.
      router.replace("/dashboard");
    } else if (sessionState === "unauthenticated" && inTabsGroup) {
      // Redirect to the login screen if the user is not authenticated but somehow in the main app area.
      router.replace("/login");
    }

  }, [sessionState, segments, router]);
}

//Root Layout                                                        */
export default function RootLayout() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("Error Boundary caught an error:", error, errorInfo);
      }}
    >
        <RootLayoutNav />
    </ErrorBoundary>
  );
}

//Navigation Logic                                                   */
type SessionState = "loading" | "authenticated" | "unauthenticated" | "error";

function RootLayoutNav() {
  const { isOnline } = useNetworkStatus();
  const { isAuthenticated, user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [hasInitialized, setHasInitialized] = useState(false);
  
  

  // Validate session on app start and resume
  const validateSession = useCallback(async () => {
    if (isOnline === false) {
      // If offline but authenticated, allow access
      if (isAuthenticated && user) {
        setSessionState("authenticated");
      } else {
        setSessionState("unauthenticated");
      }
      return;
    }

    if (!isAuthenticated) {
      setSessionState("unauthenticated");
      return;
    }

    try {
      setSessionState("loading");

      // The api interceptor will handle token refresh automatically
      await api.get("/auth/me");

      setSessionState("authenticated");
    } catch (error: any) {
      console.error("Session validation failed:", error);

      if (error.response?.status === 401) {
        // Token refresh failed, user will be logged out by interceptor
        setSessionState("unauthenticated");
      } else {
        // Network or other error - allow offline access if previously authenticated
        if (user) {
          setSessionState("authenticated");
        } else {
          setSessionState("error");
        }
      }
    }
  }, [isOnline, isAuthenticated, user]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      await validateSession();
      setHasInitialized(true);
      SplashScreen.hideAsync().catch(console.warn);
    };

    initializeSession();
  }, [validateSession]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && hasInitialized) {
        validateSession();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [hasInitialized, validateSession]);
  
  usePushNotifications()
  

  useProtectedRoute(sessionState);

  // Handle network status changes
  useEffect(() => {
    if (isOnline === true && hasInitialized) {
      validateSession();
    }
  }, [isOnline, hasInitialized, validateSession]);

  // Handle authentication state changes
  useEffect(() => {
    // if (hasInitialized) {
    //   validateSession();
    // }
    // No need to re-validate on auth change, as the initial validation and app state changes cover it.
    // If you *do* want to re-validate every time auth changes, you can add this back with `validateSession` as a dependency.
  }, [isAuthenticated, hasInitialized]);



  // Loading screen
  if (sessionState === "loading" || !hasInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        {/* <Text style={styles.loadingText}>Loading...</Text> */}
      </View>
    );
  }
   

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{persister: asyncStoragePerisiser}}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NetworkStatusIndicator isOnline={isOnline ?? true} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
// Network Status Indicator
interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> =
  React.memo(({ isOnline }) => {
    if (isOnline === false) {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      );
    }
    return null;
  });

NetworkStatusIndicator.displayName = "NetworkStatusIndicator";

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 10,
    color: "#333",
  },
  errorMessage: {
    textAlign: "center" as const,
    marginBottom: 20,
    color: "#666",
    lineHeight: 20,
  },
  retryButton: {
    color: "#007AFF",
    textDecorationLine: "underline" as const,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  offlineIndicator: {
    backgroundColor: "#ff6b6b",
    padding: 8,
    alignItems: "center" as const,
  },
  offlineText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500" as const,
  },
});

//Error Boundary Fallback                                           */
