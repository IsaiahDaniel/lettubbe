import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { forwardRef, useImperativeHandle, useRef } from "react";

const AppOtp = forwardRef(
	({ setCode, secure = false, autoFocus = true }: { setCode: (code: string) => void; secure?: boolean; autoFocus?: boolean }, ref) => {
		const { theme } = useCustomTheme();
		const otpInput = useRef<OtpInputRef>(null);

		const clearField = () => {
			if (otpInput.current) {
				otpInput.current.clear();
				setCode("");
			}
		};
		useImperativeHandle(ref, () => ({
			clearField,
		}));
		return (
			<OtpInput
				ref={otpInput}
				numberOfDigits={5}
				type="numeric"
				autoFocus={autoFocus}
				secureTextEntry={secure}
				onTextChange={setCode}
				theme={{
					pinCodeContainerStyle: {
						width: 60,
						height: 55,
						borderWidth: 1,
						borderColor: Colors[theme].text,
						borderRadius: 16,
						borderBottomWidth: 0.5,
						marginHorizontal: 0.8, 
					},
					focusedPinCodeContainerStyle: {
						borderColor: Colors.general.primary,
					},
					focusStickStyle: {
						backgroundColor: Colors.general.primary,
						height: 20, // Adjust the height as needed
						width: 2, // You can also adjust the width if necessary
					},
					pinCodeTextStyle: {
						color: Colors[theme].textBold,
						fontSize: 16,
						lineHeight: 16, // Match this with fontSize
					},
				}}
			/>
		);
	}
);

export default AppOtp;
