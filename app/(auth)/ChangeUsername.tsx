import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import TextButton from "@/components/ui/TextButton";
import Input from "@/components/ui/inputs/Input";
import BackButton from "@/components/utilities/BackButton";
import useUpdateUsername from "@/hooks/auth/useUpdateUsername";

// const usernameSuggestions = ["starboy,", "goldenboy,", "alfredo"];

const ChangeUsername = () => {
	const { control, isPending, handleSubmit, onSubmit, isValid, errors, selectSuggestion, suggestionsData } = useUpdateUsername();

	return (
		<KeyboardWrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Your username
				</Typography>
				<Typography>you can always change it later</Typography>
				<View style={{ marginTop: 20 }}>
					<Input placeholder="@previously.stated.username" control={control} name="username" error={errors.username?.message} />
				</View>
				<View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
					<Typography>Suggestions: </Typography>
					{suggestionsData?.data.suggestions.map((username: string) => (
						<TextButton title={username} key={username} isUnderlind onPress={() => selectSuggestion(username)} />
					))}
				</View>
			</View>

			<AppButton title="Next" handlePress={handleSubmit(onSubmit)} isLoading={isPending} disabled={!isValid || isPending} />
			<View style={{marginBottom: 16}} />
		</KeyboardWrapper>
	);
};

export default ChangeUsername;
