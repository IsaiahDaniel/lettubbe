import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Input from "@/components/ui/inputs/Input";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import PhoneNumberInput from "@/components/ui/inputs/PhoneInput";
import useLogin from "@/hooks/auth/useLogin";

const LoginWithPhone = () => {
	const { control, handleSubmit, handleLogin, isPending, isValid } = useLogin("phone");

	return (
		<KeyboardWrapper>
			{/* <BackButton /> */}
			<View style={{ flex: 1, marginTop: 16,}}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Welcome back
				</Typography>
				<View style={{ marginTop: 32 }}>
					<Typography style={{ marginBottom: 10 }}>Phone Number</Typography>
					<PhoneNumberInput control={control} name="phoneNumber" />
					<TextButton title="Use email instead" onPress={() => router.push("/(auth)/Login")} />
				</View>

				<View style={{ marginTop: 20 }}>
					<Typography style={{ marginBottom: 10 }}>Password</Typography>
					<Input placeholder="password" control={control} name="password" isPassword />
					<TextButton title="Forgot password" onPress={() => router.push("/(auth)/PhoneResetPassword")} />
				</View>
			</View>
			<View>
				<AppButton title="Sign in" handlePress={handleSubmit(handleLogin)} isLoading={isPending} disabled={!isValid || isPending} />
				<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
					<Typography>Don’t have an account?</Typography>
					<TextButton title="Sign up" isUnderlind onPress={() => router.push("/(auth)/PhoneSignup")} />
				</View>
			</View>
		</KeyboardWrapper>
	);
};

export default LoginWithPhone;
