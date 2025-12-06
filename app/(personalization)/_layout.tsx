import React from "react";
import { Stack } from "expo-router";

const PersonalizationLayout = () => {
	return (
		<Stack>
			<Stack.Screen name="PersonalizationScreen" options={{ headerShown: false }} />
			<Stack.Screen name="Communities" options={{ headerShown: false }} />
		</Stack>
	);
};

export default PersonalizationLayout;
