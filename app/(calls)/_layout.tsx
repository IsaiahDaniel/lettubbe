import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index"
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="incoming-call"
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="ongoing-call"
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="select-contact"
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="add-favorites"
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  );
}