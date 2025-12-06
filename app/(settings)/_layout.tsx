import React from "react";
import { Stack } from "expo-router";

const SettingsLayout = () => {
    return (
        <Stack>
            <Stack.Screen name="General" options={{ headerShown: false }} />
            <Stack.Screen name="Appearance" options={{ headerShown: false }} />
            <Stack.Screen name="ManageAccount" options={{ headerShown: false }} />
            <Stack.Screen name="DeleteAccountReason" options={{ headerShown: false }} />
            <Stack.Screen name="Privacy" options={{ headerShown: false }} />
            <Stack.Screen name="UpgradeAccount" options={{ headerShown: false }} />
        </Stack>
    );
};

export default SettingsLayout;
