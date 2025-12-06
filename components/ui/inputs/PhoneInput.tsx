import React, { useState } from "react";
import { View, TextInput, Image } from "react-native";

import RemixIcon from "react-native-remix-icon";
import { Control, useController } from "react-hook-form";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Typography from "../Typography/Typography";

type PhoneInputProps = {
	name: string;
	control: Control<any>;
	defaultValue?: string;
	icon?: string;
	iconColor?: string;
	placeholder?: string;
	rules?: object;
	[x: string]: any;
};

const PhoneNumberInput = ({ name, control, defaultValue = "", icon, placeholder = "", iconColor, rules }: PhoneInputProps) => {
	const { theme } = useCustomTheme();
	const [isFocus, setIsFocus] = useState<boolean>(false);

	const {
		field: { value, onChange, onBlur },
		fieldState: { error },
	} = useController({
		name,
		control,
		defaultValue,
		rules,
	});

	const handlePhoneNumberChange = (text: string) => {
		let formattedText = text;

		// Remove leading "0" if it exists
		if (formattedText.startsWith("0")) {
			formattedText = formattedText.slice(1);
		}

		// Limit to 10 characters
		formattedText = formattedText.slice(0, 10);

		// Update the form field
		onChange(formattedText);
	};

	return (
		<View>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					width: "100%",
					backgroundColor: Colors[theme].inputBackground,
					height: 50,
					paddingHorizontal: 15,
					borderRadius: 8,
					borderColor: isFocus ? Colors.general.gray : Colors.general.primary,
					borderWidth: 1,
				}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginRight: 8,
					}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							borderColor: Colors.general.gray,
							borderRightWidth: 2,
						}}>
						<Image
							source={{
								uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAeBAMAAACs80HuAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABVQTFRFNqEAOaIDKpsAvN+p/////P77u9+patqPNQAAAAFiS0dEBI9o2VEAAAAJcEhZcwAAAEgAAABIAEbJaz4AAAAdSURBVCjPY2AAAUZlVxcgCEkSYECAUcFRQRoJAgDKtUNjjeTzkwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxMy0xMC0wN1QxMzoxNTowMCswMjowMHb0YAsAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTMtMTAtMDdUMTM6MTU6MDArMDI6MDAHqdi3AAAAAElFTkSuQmCC",
							}}
							style={{
								width: 24,
								height: 16,
								marginRight: 4,
								borderRightWidth: 1,
								borderColor: Colors.general.gray,
							}}
						/>
						<RemixIcon name="arrow-drop-down-line" />
					</View>
					<Typography
						style={{
							fontSize: 16,
							color: Colors[theme].textBold,
							marginTop: 4,
							marginLeft: 10,
						}}>
						+234
					</Typography>
				</View>
				<TextInput
					style={{ flex: 1, fontSize: 16, color: Colors[theme].textBold }}
					placeholder="Your mobile number"
					keyboardType="phone-pad"
					value={value}
					// onChangeText={onChange}
					onChangeText={handlePhoneNumberChange}
					onFocus={() => setIsFocus(true)}
					onBlur={() => {
						onBlur();
						setIsFocus(false);
					}}
				/>
			</View>
			{error && <Typography color={Colors.general.error}>{error.message}</Typography>}
		</View>
	);
};

export default PhoneNumberInput;
