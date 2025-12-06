import React from "react";
import { View, Text, Image, FlatList, TouchableOpacity, Share, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import Typography from "@/components/ui/Typography/Typography";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import showToast from "@/helpers/utils/showToast";

const users: any[] = [
	// { id: "1", name: "Lily", image: require("../../../assets/images/avatar.png") },
	// { id: "2", name: "Sandra", image: require("../../../assets/images/avatar.png") },
	// { id: "3", name: "Big Mac", image: require("../../../assets/images/avatar.png") },
	// { id: "4", name: "Cyclone", image: require("../../../assets/images/avatar.png") },
	// { id: "5", name: "Tate", image: require("./assets/user5.jpg") },
	// { id: "6", name: "Naomi", image: require("./assets/user6.jpg") },
	// { id: "7", name: "Chutra", image: require("./assets/user7.jpg") },
	// { id: "8", name: "Barny", image: require("./assets/user8.jpg") },
	// { id: "9", name: "Patricia", image: require("./assets/user9.jpg") },
	// { id: "10", name: "Austin", image: require("./assets/user10.jpg") },
	// { id: "11", name: "Barry", image: require("./assets/user11.jpg") },
	// { id: "12", name: "Gilbert", image: require("./assets/user12.jpg") },
	// { id: "13", name: "Dodo", image: require("./assets/user13.jpg") },
];

const shareOptions = [
	{ id: "chat", name: "Chat", icon: "chatbubble-outline" },
	{ id: "telegram", name: "Telegram", icon: "paper-plane-outline" },
	{ id: "twitter", name: "Twitter", icon: "logo-twitter" },
	{ id: "whatsapp", name: "Whatsapp", icon: "logo-whatsapp" },
	{ id: "more", name: "More", icon: "share-outline" },
];

const shareLink = "lettubbe+/file/NlfVhYygR9mAQasassdsada/Share...";

const SharePost = () => {
	const { theme } = useCustomTheme();
	const copyToClipboard = async () => {
		await Clipboard.setStringAsync(shareLink);
		showToast("success", "Copied to clipboard!");
	};

	const onShare = async () => {
		try {
			await Share.share({ message: shareLink });
		} catch (error) {
			// alert((error as Error).message);
		}
	};

	return (
		<View style={styles.container}>
			<FlatList
				data={users}
				numColumns={5}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.userContainer}>
						<Image source={item.image} style={{ width: 48, height: 48, borderRadius: 30 }} />
						<Typography size={12} textType="textBold">
							{item.name}
						</Typography>
					</View>
				)}
			/>

			<View>
				<Typography textType="textBold" weight="600" style={{}}>
					Share with
				</Typography>

				<View style={styles.shareOptionsContainer}>
					{shareOptions.map((option) => (
						<TouchableOpacity key={option.id} style={styles.shareOption} onPress={option.id === "more" ? onShare : () => Linking.openURL(shareLink)}>
							<View style={{ backgroundColor: "#F2F2F7", borderRadius: 24, width: 48, height: 48, justifyContent: "center", alignItems: "center" }}>
								<Ionicons name={option.icon as any} size={24} color="#000" />
							</View>
							<Text style={styles.shareOptionText}>{option.name}</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			<View>
				<Typography size={12} style={{ textAlign: "center", marginBottom: 4 }}>
					Or share with link
				</Typography>

				<View style={styles.linkContainer}>
					<Text style={styles.linkText}>{shareLink}</Text>
					<TouchableOpacity onPress={copyToClipboard}>
						<Ionicons name="copy-outline" size={24} color={Colors[theme].textBold} />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, gap: 29 },
	userContainer: { alignItems: "center", marginHorizontal: 10, gap: 5 },
	sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginVertical: 20 },
	shareOptionsContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 20 },
	shareOption: { alignItems: "center" },
	shareOptionText: { color: "#fff", marginTop: 5, fontSize: 12 },
	linkContainer: {
		flexDirection: "row",
		backgroundColor: "#9D9D9D0A",
		borderRadius: 10,
		padding: 10,
		justifyContent: "space-between",
		alignItems: "center",
	},
	linkText: { color: "#ccc", flex: 1 },
});

export default SharePost;
