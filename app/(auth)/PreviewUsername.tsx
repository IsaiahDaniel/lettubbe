import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import useUpdateUsername from "@/hooks/auth/useUpdateUsername";

const PreviewUsername = () => {
	const { isPending, handleSubmit, onSubmit, suggestionsData } = useUpdateUsername();

	return (
		<Wrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Your username
				</Typography>
				<Typography textType="textBold" weight="700" size={30} lineHeight={35} style={{ marginTop: 16, marginBottom: 12 }}>
					@{suggestionsData?.data.suggestedUsername}
				</Typography>
				<TextButton title="Change username" onPress={() => router.push("/(auth)/ChangeUsername")} />
			</View>
			<AppButton title="Next" handlePress={handleSubmit(onSubmit)} isLoading={isPending} style={{ marginBottom: 16 }} />
			{/* <AppButton title="Next" handlePress={() => router.push("/(auth)/EnterAge")} style={{ marginBottom: 16 }} /> */}
		</Wrapper>
	);
};

export default PreviewUsername;
