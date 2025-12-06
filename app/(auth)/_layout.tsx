import React from "react";
import { Stack } from "expo-router";

const AuthLayout = () => {
	return (
		<Stack>
			<Stack.Screen name="LoginContent" options={{ headerShown: false }} />
			<Stack.Screen name="StandaloneLoginContent" options={{ headerShown: false }} />
			<Stack.Screen name="SignupContent" options={{ headerShown: false }} />
			<Stack.Screen name="StandaloneSignupContent" options={{ headerShown: false }} />
			<Stack.Screen name="EmailSignup" options={{ headerShown: false }} />
			<Stack.Screen name="VerifyOtp" options={{ headerShown: false }} />
			<Stack.Screen name="CreatePassword" options={{ headerShown: false }} />
			<Stack.Screen name="FullName" options={{ headerShown: false }} />
			<Stack.Screen name="PreviewUsername" options={{ headerShown: false }} />
			<Stack.Screen name="ChangeUsername" options={{ headerShown: false }} />
			<Stack.Screen name="EnterAge" options={{ headerShown: false }} />
			<Stack.Screen name="AddPhoto" options={{ headerShown: false }} />
			<Stack.Screen name="PhoneSignup" options={{ headerShown: false }} />
			<Stack.Screen name="Login" options={{ headerShown: false }} />
			<Stack.Screen name="LoginWithPhone" options={{ headerShown: false }} />
			<Stack.Screen name="EmailResetPassword" options={{ headerShown: false }} />
			<Stack.Screen name="PhoneResetPassword" options={{ headerShown: false }} />
			<Stack.Screen name="PasswordResetSuccess" options={{ headerShown: false }} />
			<Stack.Screen name="ChangeNewPassword" options={{ headerShown: false }} />
			<Stack.Screen name="AccountDeletionGracePeriod" options={{ headerShown: false }} />
			<Stack.Screen name="AccountDeletionGracePeriodWrapper" options={{ headerShown: false }} />
		</Stack>
	);
};

export default AuthLayout;
