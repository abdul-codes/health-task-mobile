import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// This is the entry point for all push notification logic.
// It should be called once when the app starts, probably after the user logs in.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  // Push notifications only work on physical devices, so we need to check for that first.
  if (!Device.isDevice) {
    alert("Must use physical device for Push Notifications");
    return null;
  }

  // Check the current notification permissions.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If permissions have not been granted, we need to ask the user for permission.
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If the user still did not grant permissions, we can't get a push token.
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return null;
  }

  // If we have permission, we can get the push token.
  // We need to provide the project ID to identify our app with the Expo push notification service.
  try {
    // Correctly access the projectId from expo-constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error("Could not find project ID in app.json/app.config.js. Make sure you have configured your EAS project.");
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e: any) {
    console.error("Error getting push token:", e.message);
    return null;
  }

  // On Android, we need to set a notification channel.
  // This is not required for iOS.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
