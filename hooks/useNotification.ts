import api from "@/lib/api";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";

// Only supported keys in RN notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,  
  }),
});

export async function registerForPushNotificationsAsync() {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("User did not grant permission for push notifications.");
      return;
    }
    

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
  } else {
    console.log(
      "Push Notifications are not available on simulators. Use a physical device.",
    );
  }

  return token;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );

  // Prevent double navigation when both cold-start check and listener fire
  const handledInitialResponseRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (user) {
      registerForPushNotificationsAsync().then(async (token) => {
        if (!isMounted) return;

        if (token) {
          setExpoPushToken(token);
          // Post the token (basic; consider adding auth header and dedupe later)
          api.post("/users/push-token", { token }).catch((error) => {
            console.error("Failed to save push token to backend:", error);
          });
        }

        // COLD-START: navigate if the app was opened by tapping a notification
        try {
          const lastResponse =
            await Notifications.getLastNotificationResponseAsync();
          if (lastResponse && !handledInitialResponseRef.current) {
            handledInitialResponseRef.current = true;
            const data = lastResponse.notification.request.content
              .data as { taskId?: string; patientId?: string } | undefined;

            if (data?.taskId) {
              router.push(`/tasks/${data.taskId}`);
            } else if (data?.patientId) {
              router.push(`/patients/${data.patientId}`);
            }
          }
        } catch {
          // non-fatal
        }
      });
    }

    // Foreground: received while app is open → do targeted cache refreshes
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content
          .data as { taskId?: string; patientId?: string } | undefined;

        // Invalidate notifications query to update notification screen and dashboard badge
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        if (data?.taskId) {
          // invalidate lists and the specific task
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
        } else if (data?.patientId) {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          queryClient.invalidateQueries({
            queryKey: ["patient", data.patientId],
          });
        } else {
          // fallback for generic messages
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      });

    // Tap on a notification while app is warm
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as { taskId?: string; patientId?: string } | undefined;

        if (data?.taskId) {
          router.push(`/tasks/${data.taskId}`);
        } else if (data?.patientId) {
          router.push(`/patients/${data.patientId}`);
        }
      });

    // cleanup
    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current,
        );
      }
    };
  }, [user, router, queryClient]);

  return { expoPushToken };
}
