import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="[Id]/Profile"
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="[Id]/Inbox"
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}