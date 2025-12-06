import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Input from "@/components/ui/inputs/Input";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import useRegister from "@/hooks/auth/useRegister";

const EmailSignup = () => {
	const { control, handleSubmit, isValid, isPending } = useRegister("email");

	return (
		<KeyboardWrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					What's your Email?
				</Typography>
				<View style={{ marginTop: 20 }}>
					<Input placeholder="your.email@host.com" control={control} name="email" />
				</View>
				{/* <TextButton title="Use phone number instead" onPress={() => router.push("/(auth)/PhoneSignup")} /> */}
			</View>
			<View>
				<AppButton title="Sign up" handlePress={handleSubmit} disabled={!isValid} isLoading={isPending} />
				<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
					<Typography>Already have an account?</Typography>
					<TextButton title="Sign in" isUnderlind onPress={() => router.push("/(auth)/Login")} />
				</View>
			</View>
		</KeyboardWrapper>
	);
};

export default EmailSignup;
