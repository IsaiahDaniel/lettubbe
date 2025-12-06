import { View } from "react-native";
import Typography from "./Typography/Typography";
import { Colors } from "@/constants";

const PasswordRequirement = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => {
	return (
		<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
			<View
				style={{
					width: 16,
					height: 16,
					borderRadius: 8,
					backgroundColor: fulfilled ? Colors.general.success : "",
					marginRight: 8,
					justifyContent: "center",
					alignItems: "center",
					borderWidth: 1,
					borderColor: fulfilled ? Colors.general.success : Colors.general.gray,
				}}>
				{fulfilled && (
					<Typography color="white" size={8}>
						✓
					</Typography>
				)}
			</View>
			<Typography>{text}</Typography>
		</View>
	);
};

export default PasswordRequirement;
