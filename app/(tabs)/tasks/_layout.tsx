import { Stack } from "expo-router";

export default function TaskStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }}/>
      <Stack.Screen name="test" options={{ headerShown: false }}/>
      {/*<Stack.Screen name="delete" options={{ headerShown: false }}/>*/}
    </Stack>
  );
}
