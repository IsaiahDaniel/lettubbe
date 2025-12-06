import React from "react";
import { Stack } from "expo-router";

const HomeLayout = () => {
	return (
		<Stack>
			<Stack.Screen 
				name="VideoPlayer" 
				options={{ 
					headerShown: false,
					animation: 'none',
					gestureEnabled: false,
				}} 
			/>
			<Stack.Screen 
				name="VideoPlayerWrapper" 
				options={{ 
					headerShown: false,
					animation: 'none',
					gestureEnabled: false,
				}} 
			/>
			<Stack.Screen 
				name="NotificationScreen" 
				options={{ 
					headerShown: false,
					animation: 'none',
				}} 
			/>
			{/* PhotoViewer now handled by global modal - keep for deep link compatibility */}
			<Stack.Screen 
				name="PhotoViewer" 
				options={{ 
					headerShown: false,
					presentation: 'transparentModal',
					animation: 'fade',
					gestureEnabled: false,
					contentStyle: { backgroundColor: 'transparent' },
				}} 
			/>
		</Stack>
	);
};

export default HomeLayout;
