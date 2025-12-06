import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-remix-icon";
import { useController, Control } from "react-hook-form";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "../Typography/Typography";

type InputProps = {
	name: string;
	control: Control<any>;
	defaultValue?: string;
	icon?: string;
	iconColor?: string;
	placeholder?: string;
	rules?: object;
	isPassword?: boolean;
	[x: string]: any;
};

const Input = ({ name, control, defaultValue = "", icon, placeholder = "", iconColor, rules, isPassword = false, ...props }: InputProps) => {
	const [isFocus, setIsFocus] = useState<boolean>(false);
	const [iconFocusColor, setIconFocusColor] = useState<string | undefined>(iconColor);
	const { theme } = useCustomTheme();
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false); // State for toggling visibility

	const borderColor = theme === "dark" ? "#1B2537" : "#E2E8F0";

	const {
		field: { value, onChange, onBlur },
		fieldState: { error },
	} = useController({
		name,
		control,
		defaultValue,
		rules,
	});

	return (
		<View>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					width: "100%",
					paddingHorizontal: 15,
					borderRadius: 15,
					borderColor: isFocus ? Colors.general.primary : borderColor,
					borderWidth: 1,
					height: 49,
					backgroundColor: Colors[theme].inputBackground,
				}}
				// pointerEvents={disable ? "none" : "auto"}
			>
				<TextInput
					style={{
						flex: 1,
						fontSize: 14,
						color: Colors[theme].text as any,
						backgroundColor: "transparent",
						fontFamily: "Manrope-Regular",
					}}
					placeholder={placeholder}
					placeholderTextColor={Colors[theme].textLight}
					value={value}
					onChangeText={onChange}
					onBlur={() => {
						onBlur();
						setIsFocus(false);
						setIconFocusColor("");
					}}
					onFocus={() => {
						setIsFocus(true);
						setIconFocusColor(iconColor);
					}}
					keyboardType={name === "email" ? "email-address" : "default"}
					autoComplete={name === "email" ? "email" : "off"}
					secureTextEntry={isPassword && !isPasswordVisible}
				/>
				{isPassword ? (
					<TouchableOpacity onPress={() => setIsPasswordVisible((prev) => !prev)}>
						<Icon name={isPasswordVisible ? "eye-line" : "eye-off-line"} size={24} color={Colors[theme].textBold} />
					</TouchableOpacity>
				) : (
					icon && <Image source={icon as any} tintColor={Colors[theme].text} style={{ width: 16, height: 16 }} />
				)}
			</View>
			{error && (
				<Typography size={12} style={{ marginTop: 2 }} color={Colors.general.error}>
					{error.message}
				</Typography>
			)}
		</View>
	);
};

export default Input;
