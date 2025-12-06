import { Stack } from 'expo-router';
import React from 'react';
import { NavigationVisibilityProvider } from '@/contexts/NavigationVisibilityContext';

export default function CommunityLayout() {
  return (
    <NavigationVisibilityProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="create-step1" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="create-step2"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="create-step3"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="create-step4"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </NavigationVisibilityProvider>
  );
}