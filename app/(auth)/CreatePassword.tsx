import { View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import Input from "@/components/ui/inputs/Input";
import { Colors } from "@/constants";
import PasswordRequirement from "@/components/ui/PasswordRequirement";
import { useCreatePassword } from "@/hooks/auth/useCreatePassword";
import TermsAndPrivacyModal from "@/components/shared/onboarding/TermsAndPrivacyModal"; 

const CreatePassword = () => {
	const { control, isValid, handleSubmit, onSubmit, requirements, isPending, error } = useCreatePassword("create");
	const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

	const openModal = (type: 'terms' | 'privacy') => {
		setModalType(type);
	};

	const closeModal = () => {
		setModalType(null);
	};

	return (
		<>
			<KeyboardWrapper>
				<View style={{ flex: 1, marginTop: 16 }}>
					<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
						Create Password
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
							width: "96%",
							marginHorizontal: "auto",
							marginBottom: 40,
							flexWrap: "wrap",
						}}>
						<Typography style={{ textAlign: "center" }}>
							By using LETTUBBE+, you agree to the{" "}
						</Typography>
						<TouchableOpacity onPress={() => openModal('terms')}>
							<Typography weight="600" color={Colors.general.blue}>
								Terms
							</Typography>
						</TouchableOpacity>
						<Typography style={{ textAlign: "center" }}>
							{" "}and{" "}
						</Typography>
						<TouchableOpacity onPress={() => openModal('privacy')}>
							<Typography weight="600" color={Colors.general.blue}>
								Privacy policy
							</Typography>
						</TouchableOpacity>
						<Typography style={{ textAlign: "center" }}>
							.
						</Typography>
					</View>

					<AppButton
						title="Continue"
						handlePress={handleSubmit(onSubmit)}
						disabled={!isValid || isPending}
						isLoading={isPending}
						style={{ marginBottom: 16 }}
					/>
				</View>
			</KeyboardWrapper>

			{/* Terms and Privacy Modal */}
			{modalType && (
				<TermsAndPrivacyModal
					isVisible={!!modalType}
					onClose={closeModal}
					type={modalType}
				/>
			)}
		</>
	);
};

export default CreatePassword;