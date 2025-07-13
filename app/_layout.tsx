// --- Imports ---
import { AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
// Corrected import path for the hook
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import api from '../lib/api';

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { router, Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { useAuth } from "../hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { connectSocket, disconnectSocket } from "@/lib/clientsocket";
import { Task } from "@/lib/types";
// Import the 'shallow' middleware for Zustand


// --- Client Setup ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});


// --- Main Exported Component ---
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SessionProvider>
          <RootLayoutNav />
        </SessionProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}


// --- SessionProvider Component ---
const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuth(state => state.isAuthenticated);
  const { isOnline } = useNetworkStatus();
  const [isAppReady, setAppReady] = useState(false);

  const validateSession = useCallback(async () => {
    if (isOnline === false) {
      if (!isAppReady) setAppReady(true);
      return;
    }
    try {
      await api.get('/auth/me');
    } catch (error) {
      console.log(`Session validation failed. Error: ${error}`);
    } finally {
      if (!isAppReady) setAppReady(true);
    }
  }, [isOnline, isAppReady]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      validateSession();
    }
  }, [validateSession]);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    validateSession();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove() };
  }, [validateSession, handleAppStateChange]);
  
  useEffect(() => {
    if (!isAppReady) return;
    SplashScreen.hideAsync();
    if (isAuthenticated) {
      router.replace('/(tabs)/tasks');
    } else {
      router.replace('/');
    }
  }, [isAuthenticated, isAppReady]);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
};


// --- RootLayoutNav Component ---
function RootLayoutNav() {
  // const isAuthenticated = useAuth(state => state.isAuthenticated);
  // const accessToken = useAuth(state => state.accessToken);
  // const user = useAuth(state => state.user);
  // const queryClient = useQueryClient();
  
  // useEffect(() => {
  //   if (isAuthenticated && accessToken && user?.id) {
  //     const socket = connectSocket(accessToken, user.id);
  //     socket.on("newTask", (newTask: Task) => {
  //       console.log("Received new task via WebSocket:", newTask);
  //       queryClient.invalidateQueries({ queryKey: ["tasks"] });
  //     });
  //     return () => {
  //       socket.off("newTask");
  //       disconnectSocket();
  //     };
  //   }
  // }, [isAuthenticated, accessToken, user, queryClient]);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
