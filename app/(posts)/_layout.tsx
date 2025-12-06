import React from "react";
import { Stack } from "expo-router";

const EditPostLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="editPost" options={{ headerShown: false }} />
      <Stack.Screen name="editDetails" options={{ headerShown: false }} />
    </Stack>
  );
};

export default EditPostLayout;