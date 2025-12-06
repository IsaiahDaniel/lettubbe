import { Stack } from "expo-router";

export default function StreamingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="upcoming" />
      <Stack.Screen name="stream/[streamId]" />
    </Stack>
  );
}