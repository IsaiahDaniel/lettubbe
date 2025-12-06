import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import Input from "@/components/ui/inputs/Input";
import { useFullName } from "@/hooks/auth/useFullName";

const FullName = () => {
	const { control, errors, isValid, handleSubmit, onSubmit, isPending, error } = useFullName();

	return (
		<KeyboardWrapper>
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					What’s your full name?
				</Typography>

				<View style={{ marginTop: 20 }}>
					<Typography style={{ marginBottom: 12 }}>First name</Typography>
					<Input placeholder="first name" control={control} name="firstName" />
				</View>
				<View style={{ marginTop: 12 }}>
					<Typography style={{ marginBottom: 12 }}>Last name</Typography>
					<Input placeholder="last name" control={control} name="lastName" />
				</View>
			</View>
			<AppButton title="Next" handlePress={handleSubmit(onSubmit)} isLoading={isPending} disabled={!isValid || isPending} />
			<View style={{marginBottom: 16}} />
		</KeyboardWrapper>
	);
};

export default FullName;
