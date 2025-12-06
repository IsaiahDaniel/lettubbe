import React from "react";
import { View, ScrollView, Linking } from "react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import { useAlert } from "@/components/ui/AlertProvider";

interface UpdateModalProps {
	isVisible: boolean;
	onClose: () => void;
	latestVersion: string;
	currentVersion: string;
	releaseNotes: string;
	isForced?: boolean; // For critical updates that require immediate action
}

const UpdateModal: React.FC<UpdateModalProps> = ({
	isVisible,
	onClose,
	latestVersion,
	currentVersion,
	releaseNotes,
	isForced = false,
}) => {
	const { theme } = useCustomTheme();
	const { showError } = useAlert();

	const openUrl = async (url: string, fallbackMessage: string) => {
		try {
			const supported = await Linking.canOpenURL(url);
			if (supported) {
				await Linking.openURL(url);
			} else {
				showError("Cannot Open Link", fallbackMessage);
			}
		} catch (error) {
			console.error("Error opening URL:", error);
			showError("Error", fallbackMessage);
		}
	};

	const handleUpdate = () => {
		// Direct download from website
		openUrl(
			"https://lettubbe.com",
			"Unable to open lettubbe.com. Please visit the website manually to download the latest version."
		);
	};

	const handleLater = () => {
		if (!isForced) {
			onClose();
		}
	};

	return (
		<CustomBottomSheet
			isVisible={isVisible}
			onClose={handleLater}
			title="New Update Available"
			showClose={!isForced}
			sheetheight="auto"
		>
			<View style={{
				paddingBottom: 20,
			}}>
				{/* Version Info */}
				<View style={{ 
					flexDirection: "row", 
					justifyContent: "space-between", 
					marginBottom: 16,
					paddingVertical: 12,
					paddingHorizontal: 16,
					backgroundColor: Colors[theme].cardBackground,
					borderRadius: 12,
				}}>
					<View>
						<Typography 
							size={12}
							color={Colors[theme].textLight}
						>
							Current Version
						</Typography>
						<Typography 
							size={18}
							weight="600"
							color={Colors[theme].textBold}
							style={{ marginTop: 4 }}
						>
							{currentVersion}
						</Typography>
					</View>
					<View style={{ alignItems: "flex-end" }}>
						<Typography 
							size={12}
							color={Colors[theme].textLight}
						>
							Latest Version
						</Typography>
						<Typography 
							size={18}
							weight="600"
							color={Colors.general.primary}
							style={{ marginTop: 4 }}
						>
							{latestVersion}
						</Typography>
					</View>
				</View>

				{/* Update Message */}
				<Typography 
					size={14}
					color={Colors[theme].text}
					align="center"
					lineHeight={22}
					style={{ marginBottom: 16 }}
				>
					{isForced 
						? "This update is required to continue using the app. Please update now to access all features."
						: "A new version of Lettubbe is available with exciting new features and improvements!"
					}
				</Typography>

				{/* Release Notes */}
				{/* {releaseNotes && (
					<View style={{ marginBottom: 24 }}>
						<Typography 
							size={16}
							weight="600"
							color={Colors[theme].textBold}
							style={{ marginBottom: 12 }}
						>
							What's New:
						</Typography>
						<ScrollView 
							style={{ 
								maxHeight: 200,
								backgroundColor: Colors[theme].cardBackground,
								borderRadius: 8,
								padding: 16,
							}}
							showsVerticalScrollIndicator={false}
						>
							<Typography 
								size={12}
								color={Colors[theme].text}
								lineHeight={20}
							>
								{releaseNotes}
							</Typography>
						</ScrollView>
					</View>
				)} */}

				{/* Action Buttons */}
				<View style={{ gap: 12 }}>
					<AppButton
						title="Update Now"
						handlePress={handleUpdate}
						variant="primary"
						style={{ 
							backgroundColor: Colors.general.primary,
							borderRadius: 12,
						}}
					/>
					
					{!isForced && (
						<AppButton
							title="Later"
							handlePress={handleLater}
							variant="secondary"
							style={{ 
								backgroundColor: Colors[theme].cardBackground,
								borderRadius: 12,
							}}
						/>
					)}
				</View>
			</View>
		</CustomBottomSheet>
	);
};

export default UpdateModal;