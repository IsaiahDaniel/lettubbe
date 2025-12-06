import { Colors } from "@/constants";
import React from "react";
import { View, Pressable, Image } from "react-native";
import { truncateText } from "@/helpers/utils/util";
import Typography from "@/components/ui/Typography/Typography";

interface AvatarProps {
	name: string | undefined;
	imageSource: any;
	isSelected: boolean;
	onPress: () => void;
	theme: "light" | "dark";
}

const CommunityCard: React.FC<AvatarProps> = ({ name, imageSource, isSelected, onPress, theme }) => {
	return (
		<View style={{ width: "25%", alignItems: "center", marginBottom: 12 }}>
			<Pressable
				onPress={onPress}
				style={{
					justifyContent: "center",
					alignItems: "center",
					borderWidth: 2.5,
					borderColor: isSelected ? Colors.general.primary : Colors[theme].borderColor,
					borderRadius: 80,
					width: 75,
					height: 75,
					padding: 5,
				}}>
				<View
					style={{
						justifyContent: "center",
						alignItems: "center",
						borderWidth: 0.5,
						borderColor: Colors[theme].borderColor,
						width: 60,
						height: 60,
						borderRadius: 65,
					}}>
					<Image source={imageSource} style={{ width: 60, height: 60 }} />
				</View>
			</Pressable>
			<Typography textType="textBold" weight="400" size={11.5} lineHeight={22}>
				{truncateText(name || "Unknown", 6)}
			</Typography>
		</View>
	);
};

export default CommunityCard;
