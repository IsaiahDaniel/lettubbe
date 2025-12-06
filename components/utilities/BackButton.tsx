import { StyleSheet, TouchableOpacity, Image } from "react-native";
import React from "react";

import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { router } from "expo-router";

interface RightBtnProps {
	handlePress?: () => void;
}
const BackButton = ({ handlePress }: RightBtnProps) => {
	const { theme } = useCustomTheme();

	const handleRoute = () => {
		if (handlePress) {
			handlePress();
		} else {
			router.back();
		}
	};

	return (
		<TouchableOpacity onPress={handleRoute} style={[styles.backBtn]} activeOpacity={0.7}>
			<Image source={Icons.back} style={{ width: 12.31, height: 21.84 }} tintColor={Colors[theme].textBold} />
		</TouchableOpacity>
	);
};

export default BackButton;

const styles = StyleSheet.create({
	backBtn: {
		padding: 5,
	},
});
