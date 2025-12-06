import { TouchableOpacity, View } from "react-native";
import React from "react";
import { router, useNavigation } from "expo-router";
import BackButton from "../utilities/BackButton";
import Typography from "./Typography/Typography";

const TopHeader = ({
	title,
	routeTo,
	actionBtn,
	onPress,
}: {
	title?: string;
	routeTo?: () => void;
	actionBtn?: React.ReactNode;
	onPress?: () => void;
	icon?: any;
}) => {
	const navigation = useNavigation();

	const handleBack = () => {
		if (routeTo) {
			routeTo();
		} else if (navigation.canGoBack()) {
			router.back();
		} else {
			return;
		}
	};
	return (
		<View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 12 }}>
			<BackButton handlePress={handleBack} />
			<Typography size={16} weight="600" textType="textBold">
				{title}
			</Typography>

			{actionBtn ? (
				<TouchableOpacity activeOpacity={0.7} onPress={onPress}>
					{actionBtn}
				</TouchableOpacity>
			) : (
				<View style={{ width: 48 }}></View>
			)}
		</View>
	);
};

export default TopHeader;
