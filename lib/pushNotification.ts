//import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import api from './api'; // Assuming you have a configured axios instance

// This handler determines how the app behaves when a notification is received while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show the notification alert
    shouldPlaySound: true, // Play a sound
    shouldSetBadge: false, // Don't change the app icon's badge number
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(authToken: string) {
  let token;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn('Push notifications are not available on simulators. Use a physical device.');
    return;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If permission has not been granted, ask the user
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If the user ultimately denies permission, exit the function
  if (finalStatus !== 'granted') {
    console.log('User denied push notification permissions.');
    return;
  }

  // Get the Expo Push Token
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Ensure you have this in your .env
    })).data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Failed to get push token:', error);
    return;
  }

  // --- Send the token to your backend ---
  if (token) {
    try {
      await api.post('/users/push-token', 
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log('Push token successfully sent to backend.');
    } catch (error) {
      console.error('Failed to send push token to backend:', error);
    }
  }

  // --- Handle user interaction with notifications ---
  // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    // Here, you can navigate the user to a specific screen based on the notification data
    const taskId = response.notification.request.content.data.taskId;
    if (taskId) {
      router.push(`/(tabs)/tasks/${taskId}`); // Example: navigate to a task detail screen
    }
  });

  return token;
}
