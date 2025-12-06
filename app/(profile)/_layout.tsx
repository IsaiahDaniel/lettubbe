import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
	return (
		<Stack>
			<Stack.Screen name="Settings" options={{ headerShown: false }} />
			<Stack.Screen name="ViewPlaylist" options={{ headerShown: false }} />
			<Stack.Screen name="SavedVideos" options={{ headerShown: false }} />
			<Stack.Screen name="CreatePlaylist" options={{ headerShown: false }} />
			<Stack.Screen name="EditProfile" options={{ headerShown: false }} />
			<Stack.Screen name="AddPlaylistVideo" options={{ headerShown: false }} />
			<Stack.Screen name="Subscribers" options={{ headerShown: false }} />
			<Stack.Screen name="SaveToPlaylist" options={{ headerShown: false }} />
		</Stack>
	);
};

export default ProfileLayout;
