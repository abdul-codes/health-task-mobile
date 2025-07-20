import { Stack } from "expo-router";

export default function PatientStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" options={{ title: "Create Patient", presentation: "modal" }} />
    </Stack>
  );
}
