import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "../global.css";
import { AuthState, useAuth } from "./hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { connectSocket, disconnectSocket } from "@/lib/clientsocket";
import { Task } from "@/lib/types";
//import SafeScreen from "./components/SafeScreen";

// Create a client
const mainqueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, token, user } = useAuth(
    (state: AuthState) => ({
      isAuthenticated: state.isAuthenticated,
      token: state.token,
      user: state.user,
    })
  );
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      // Connect the socket and join user-specific room
      const socket = connectSocket(token, user.id);

      // --- Set up event listeners ---
      socket.on("newTask", (newTask: Task) => {
        console.log("Received new task via WebSocket:", newTask);
        
        // Invalidate and refetch queries to update the UI
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks-created-by-me"] });

        // Optionally, show a local notification or toast
        // (Push notifications are a separate implementation)
      });
      
      return () => {
        // --- Clean up listeners and disconnect ---
        console.log("Cleaning up socket connection.");
        socket.off("newTask");
        disconnectSocket();
      };
    }
  }, [isAuthenticated, token, user, queryClient]);
  
  // This effect will route the user based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/tasks');
    } else {
      router.replace('/');
    }
  }, [isAuthenticated]);
  return (
    <QueryClientProvider client={mainqueryClient}>
        {/* <SafeScreen> */}
      <SafeAreaProvider>
          
        <StatusBar style="auto" />
        {/*
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            title: 'Welcome',
            headerShown: false,
            // Prevent going back to welcome screen if authenticated
            gestureEnabled: !isAuthenticated
          }}
        />
        {/* <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            // Prevent going back to auth screens if authenticated
            gestureEnabled: !isAuthenticated
          }}
        />

        <Stack.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerShown: false,
            // Prevent going back to auth screens if not authenticated
            gestureEnabled: isAuthenticated
          }}
        />
        <Stack.Screen
          name="tasks"
          options={{
            headerShown: false,
            // Only allow access to tasks if authenticated
            gestureEnabled: isAuthenticated
          }}
        />
      </Stack>
       */}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
      {/* </SafeScreen> */}

    </QueryClientProvider>
  );
}
