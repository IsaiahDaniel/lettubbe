import React from "react";
import { View, Image } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import BackButton from "@/components/utilities/BackButton";
import { router } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import { Images } from "@/constants";

const PasswordResetSuccess = () => {
	return (
		<Wrapper>
			{/* <BackButton /> */}
			<View style={{ flex: 1, marginTop: 40, width: "85%", marginHorizontal: "auto" }}>
				<Image source={Images.resetSuccess} style={{ width: 200, height: 200, alignSelf: "center" }} />

				<Typography style={{ textAlign: "center" }} lineHeight={25}>
					Your password has been updated successfully. You can now log in and continue where you left off.
				</Typography>
			</View>

			<AppButton title="Back to login" handlePress={() => router.push("/(auth)/Login")} style={{ marginBottom: 16 }} />
		</Wrapper>
	);
};

export default PasswordResetSuccess;
