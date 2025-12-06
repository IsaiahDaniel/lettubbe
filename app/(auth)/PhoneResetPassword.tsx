import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import PhoneNumberInput from "@/components/ui/inputs/PhoneInput";
import useForgotPassword from "@/hooks/auth/useForgotPassword";

const PhoneResetPassword = () => {
	const { control, handleSubmit, isValid, isPending } = useForgotPassword("phone");

	return (
		<KeyboardWrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Reset password
				</Typography>
				<Typography>We will email you a link to reset your password.</Typography>
				<View style={{ marginTop: 32 }}>
					<Typography style={{ marginBottom: 10 }}>Phone Number</Typography>
					<PhoneNumberInput control={control} name="phone" />
					<TextButton title="Use email instead" onPress={() => router.push("/(auth)/EmailResetPassword")} />
				</View>
			</View>
			<View>
				<AppButton style={{ marginBottom: 16 }} title="Send code" handlePress={handleSubmit} disabled={!isValid} isLoading={isPending} />
			</View>
		</KeyboardWrapper>
	);
};

export default PhoneResetPassword;
