import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Typography from "./Typography/Typography";
import { Colors } from "@/constants";

interface SecondaryButtonProps {
	title: string;
	onPress: () => void;
	style?: ViewStyle;
	textStyle?: TextStyle;
	isUnderlind?: boolean;
}

const TextButton: React.FC<SecondaryButtonProps> = ({ title, onPress, style, textStyle, isUnderlind }) => {
	return (
		<TouchableOpacity style={[styles.secondaryButton, style]} onPress={onPress}>
			<Typography
				weight="600"
				size={14}
				style={[{ color: Colors.general.blue }, isUnderlind && { textDecorationLine: "underline" }, textStyle]}>
				{title}
			</Typography>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	secondaryButton: {
		paddingVertical: 10,
	},
});

export default TextButton;
