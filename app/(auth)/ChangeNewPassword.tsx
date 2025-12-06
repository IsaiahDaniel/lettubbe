import { View } from "react-native";
import React from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import Input from "@/components/ui/inputs/Input";
import { ExternalLink } from "@/components/ExternalLink";
import { Colors } from "@/constants";
import PasswordRequirement from "@/components/ui/PasswordRequirement";
import { useCreatePassword } from "@/hooks/auth/useCreatePassword";

const ChangeNewPassword = () => {
	const { control, isValid, handleSubmit, onSubmit, requirements, isPending, error } = useCreatePassword("reset");

	return (
		<KeyboardWrapper>
			{/* <BackButton /> */}
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Create New Password
				</Typography>

				<View style={{ marginTop: 20 }}>
					<Typography style={{ marginBottom: 10 }}>Password</Typography>
					<Input label="Password" control={control} name="password" secureTextEntry placeholder="*******" isPassword />
				</View>
				{/* Password requirements */}
				<View style={{ marginTop: 20 }}>
					<PasswordRequirement fulfilled={requirements.minChars} text="At least 8 characters" />
					<PasswordRequirement fulfilled={requirements.hasNumber} text="Contains a number" />
					<PasswordRequirement fulfilled={requirements.hasSymbol} text="Contains a symbol" />
				</View>
				{/* Error message from mutation if any */}
				{error && <Typography color={Colors.general.error}>{error instanceof Error ? error.message : "Something went wrong"}</Typography>}
			</View>
			<View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						width: "80%",
						marginHorizontal: "auto",
						marginBottom: 40,
					}}>
					<Typography style={{ textAlign: "center" }}>
						By using LETTUBBE+, you agree to the {""}
						<ExternalLink href="#">
							<Typography weight="600" color={Colors.general.blue}>
								Terms {""}
							</Typography>{" "}
						</ExternalLink>
						and {""}
						<ExternalLink href="#">
							<Typography weight="600" color={Colors.general.blue}>
								Privacy policy.
							</Typography>
						</ExternalLink>
					</Typography>
				</View>

				<AppButton
					title="Confirm Password"
					handlePress={handleSubmit(onSubmit)}
					disabled={!isValid || isPending}
					isLoading={isPending}
					style={{ marginBottom: 16 }}
				/>
			</View>
		</KeyboardWrapper>
	);
};

export default ChangeNewPassword;
