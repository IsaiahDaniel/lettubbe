import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Input from "@/components/ui/inputs/Input";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import useForgotPassword from "@/hooks/auth/useForgotPassword";

const EmailResetPassword = () => {
	const { control, handleSubmit, isValid, isPending } = useForgotPassword("email");
	return (
		<KeyboardWrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Reset password
				</Typography>
				<Typography>We will email you a code to reset your password.</Typography>
				<View style={{ marginTop: 32 }}>
					<Typography style={{ marginBottom: 10 }}>Email</Typography>
					<Input placeholder="your.email@host.com" control={control} name="email" />
					{/* <TextButton title="Use phone number instead" onPress={() => router.push("/(auth)/PhoneResetPassword")} /> */}
				</View>
			</View>
			<View>
				<AppButton style={{ marginBottom: 16 }} title="Send code" handlePress={handleSubmit} disabled={!isValid} isLoading={isPending} />
			</View>
		</KeyboardWrapper>
	);
};

export default EmailResetPassword;
