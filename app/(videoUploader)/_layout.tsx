import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen name="drafts" options={{ headerShown: false }} />
      <Stack.Screen name="videoDetails" options={{ headerShown: false }} />
      <Stack.Screen name="videoEditor" options={{ headerShown: false }} />
      <Stack.Screen name="photoDetails" options={{ headerShown: false }} />
      <Stack.Screen name="photo-camera" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProfileLayout;