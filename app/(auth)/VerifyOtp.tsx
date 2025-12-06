import React from "react";
import { View, Pressable } from "react-native";
import AppButton from "@/components/ui/AppButton";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";

import AppOtp from "@/components/ui/AppOtp";
import { timer } from "@/helpers/utils/util";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import BackButton from "@/components/utilities/BackButton";
import TextButton from "@/components/ui/TextButton";
import { Colors } from "@/constants";
import useVerifyOtp from "@/hooks/auth/useVerifyOTP";

const VerifyOtp = () => {
	const router = useRouter();
	const navigation = useNavigation();
	const { type, email, phone, nextRoute } = useLocalSearchParams();

	// Determine the verification type and contact info
	const verificationType = type === "email" ? "email" : "phone";
	const contactInfo = type === "email" ? (email as string) : (phone as string);

	const { otp, setOtp, countDownSeconds, isVerifying, isResending, verifyError, verifyOtp, resendOtp } = useVerifyOtp(
		verificationType,
		contactInfo,
		nextRoute as string
	);

	const handleBackPress = () => {
		// Check if we can go back in the navigation stack
		if (navigation.canGoBack()) {
			router.back();
		} else {
			// If no previous screen, navigate back to login screen
			router.replace("/(auth)/LoginContent");
		}
	};

	const handleWrongInfo = () => {
		router.back();
		// if (type === "email") {
		// 	router.push("/(auth)/EmailSignup");
		// } else {
		// 	router.push("/(auth)/PhoneSignup");
		// }
	};

	return (
		<KeyboardWrapper>
			<BackButton handlePress={handleBackPress} />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33}>
					Verify {type === "email" ? "Email" : "Phone"}
				</Typography>
				<Typography style={{ marginVertical: 16 }} lineHeight={24}>
					We just sent a 5-digit code to{" "}
					<Typography weight="600" style={{}}>
						{contactInfo?.toLowerCase()}
					</Typography>
					, Enter it below:
				</Typography>

				{type === "email" && (
					<Typography style={{ marginBottom: 16 }} size={14} textType="secondary" lineHeight={20}>
						💡 Can't find the code? Check your spam/junk folder - OTP emails sometimes end up there.
					</Typography>
				)}

				<View style={{ width: "100%", marginHorizontal: "auto" }}>
					<Typography style={{ marginBottom: 4 }}>Code</Typography>
					<AppOtp setCode={setOtp} />

					{verifyError.show && (
						<Typography color="error" style={{ marginTop: 8 }}>
							{verifyError.msg}
						</Typography>
					)}

					<Pressable disabled={countDownSeconds > 0 || isResending} onPress={resendOtp} style={{ marginTop: 16, marginLeft: "auto" }}>
						<Typography align="center" textType="textBold" color={countDownSeconds === 0 ? Colors.general.blue : ""}>
							{isResending ? "Resending code" : "Resend code"} {""}
							{countDownSeconds !== 0 && <Typography weight="700">in {timer(countDownSeconds)}</Typography>}
						</Typography>
					</Pressable>
				</View>
			</View>

			<View>
				<AppButton
					title={`Verify ${type === "email" ? "Email" : "Phone"}`}
					handlePress={verifyOtp}
					isLoading={isVerifying}
					disabled={otp.length !== 5 || isVerifying}
				/>
				<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
					<Typography>Wrong {type === "email" ? "email" : "phone"}?</Typography>
					<TextButton title={`Send To Different ${type === "email" ? "email" : "phone"}`} onPress={handleWrongInfo} />
				</View>
			</View>
		</KeyboardWrapper>
	);
};

export default VerifyOtp;
