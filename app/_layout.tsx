import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  AppStateStatus,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, SplashScreen, router } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import { queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import api from "../lib/api";

import "../global.css";

/* ------------------------------------------------------------------ */
/* Error Boundary Fallback                                           */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Root Layout                                                        */
/* ------------------------------------------------------------------ */
export default function RootLayout() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("Error Boundary caught an error:", error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation Logic                                                   */
/* ------------------------------------------------------------------ */
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
      await api.get("/api/auth/me");
      
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
    }, [isOnline, isAuthenticated, user])

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

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [hasInitialized, validateSession]);

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

  // Navigation effect
  useEffect(() => {
    if (!hasInitialized || sessionState === "loading") return;

    try {
      if (sessionState === "authenticated") {
        router.replace("/(tabs)/tasks");
      } else {
        router.replace("/");
      }
    } catch (error) {
      console.warn("Navigation failed:", error);
    }
  }, [sessionState, hasInitialized]);

  // Loading screen
  if (sessionState === "loading" || !hasInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Main app render
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NetworkStatusIndicator isOnline={isOnline ?? true} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
/* ------------------------------------------------------------------ */
/* Network Status Indicator                                          */
/* ------------------------------------------------------------------ */
interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = React.memo(
  ({ isOnline }) => {
    if (isOnline === false) {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      );
    }
    return null;
  }
);

NetworkStatusIndicator.displayName = "NetworkStatusIndicator";

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = {
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
};