import React, { useState, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, FlatList, Image, Text, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import useVideoUploadStore from "@/store/videoUploadStore";
import BackButton from "@/components/utilities/BackButton";
import usePlaylist from "@/hooks/profile/usePlaylist";

// mock playlists with thumbnail images
const MOCK_PLAYLISTS = [
	{ id: "private", name: "Private", videoCount: 0, thumbnail: require("@/assets/images/playlists/private.png"), isPrivate: true },
	{ id: "games", name: "Games", videoCount: 28, thumbnail: require("@/assets/images/playlists/games.png"), isPrivate: false },
	{ id: "diy", name: "DIY", videoCount: 14, thumbnail: require("@/assets/images/playlists/diy.png"), isPrivate: false },
	{ id: "funk", name: "FUNK up", videoCount: 6, thumbnail: require("@/assets/images/playlists/funk.png"), isPrivate: false },
	{ id: "hz", name: "Hz", videoCount: 2, thumbnail: require("@/assets/images/playlists/hz.png"), isPrivate: false },
];

// Sort options for the dropdown
const SORT_OPTIONS = [
	{ id: "all", label: "All" },
	{ id: "recent", label: "Recently added" },
	{ id: "alpha", label: "Alphabetical" },
	{ id: "played", label: "Recently played" },
];

export default function PlaylistScreen() {
	const router = useRouter();
	const { theme } = useCustomTheme();
	const { videoDetails, setVideoDetails } = useVideoUploadStore();

	const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(videoDetails.playlistIds || ["private"]);
	const [sortBy, setSortBy] = useState("all");
	const [showSortModal, setShowSortModal] = useState(false);
	const { allPlaylists, refetchPlaylist } = usePlaylist();

	// Refresh playlists whenever the screen comes into focus
	useFocusEffect(
		useCallback(() => {
			refetchPlaylist();
		}, [refetchPlaylist])
	);

	// console.log("All Playlist ", JSON.stringify(allPlaylists, null, 2));

	const handleDone = () => {
		// Save selected playlists before going back
		setVideoDetails({ ...videoDetails, playlistIds: selectedPlaylists });
		router.back();
	};

	const handleNewPlaylist = () => {
		router.push({
      pathname: "/(profile)/CreatePlaylist" as any
    });
	};

	const togglePlaylist = (playlistId: string) => {
		setSelectedPlaylists((prev) => {
			if (prev.includes(playlistId)) {
				return prev.filter((id) => id !== playlistId);
			} else {
				return [...prev, playlistId];
			}
		});
	};

	const toggleSortModal = () => {
		setShowSortModal(!showSortModal);
	};

	const selectSortOption = (option: string) => {
		setSortBy(option);
		setShowSortModal(false);
	};

	// Separate private and public playlists
	// const privatePlaylist = MOCK_PLAYLISTS.filter((playlist) => playlist.isPrivate);
	const privatePlaylist = allPlaylists?.data?.data.filter((playlist: any) => playlist.visibility == "private");

	// Get sorted public playlists based on selected sort option
	const getSortedPublicPlaylists = () => {
		let publicPlaylists = allPlaylists?.data?.data.filter((playlist: any) => playlist.visibility !== "private");

		switch (sortBy) {
			case "alpha":
				publicPlaylists.sort((a: any, b: any) => a.name.localeCompare(b.name));
				break;
			case "recent":
				// For this example, I'll use the original order
				break;
			case "played":
				// For this example, I'll use the original order
				break;
			default:
				// 'all' - keep original order
				break;
		}

		return publicPlaylists;
	};

	const renderPlaylistItem = ({ item }: { item: any }) => {
		const isSelected = selectedPlaylists.includes(item._id);

		// console.log("Selected Playlists", selectedPlaylists);

		return (
			<TouchableOpacity style={styles.playlistItem} key={item._id} onPress={() => togglePlaylist(item._id)}>
				<View style={styles.thumbnailContainer}>
					<Image source={item.coverPhoto ? { uri: item.coverPhoto } : Images.avatar} style={styles.thumbnail} />
				</View>

				<View style={styles.playlistTextContainer}>
					<View style={styles.nameContainer}>
						<Typography size={16} weight="500">
							{item.name}
						</Typography>
						{item.isPrivate && <RemixIcon name="lock-line" size={16} color="#666" style={styles.lockIcon} />}
					</View>

					<Typography size={14} weight="400" textType="secondary">
						{item?.videos.length} {item?.videos <= 1 ? "video" : "videos"}
					</Typography>
				</View>

				<View style={styles.checkboxContainer}>
					{isSelected ? (
						<View style={styles.checkboxOuterSelected}>
							<View style={styles.checkboxInnerSelected} />
						</View>
					) : (
						<View style={styles.checkbox} />
					)}
				</View>
			</TouchableOpacity>
		);
	};

	// Render the sorting dropdown option
	const renderSortDropdown = () => (
		<View style={styles.sectionHeader}>
			<Typography size={15} weight="500">
				Playlists
			</Typography>
			<TouchableOpacity style={styles.sortDropdown} onPress={toggleSortModal}>
				<Typography size={14} weight="500" style={styles.sortText}>
					{SORT_OPTIONS.find((option) => option.id === sortBy)?.label || "All"}
				</Typography>
				<RemixIcon name="arrow-down-line" size={20} color="#666" />
			</TouchableOpacity>
		</View>
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]} edges={["top"]}>
			<View style={styles.header}>
				<View style={styles.lefticons}>
					<BackButton />
					<Typography size={17} weight="600">
						Add to playlist
					</Typography>
				</View>
				<TouchableOpacity onPress={handleNewPlaylist}>
					<Text style={styles.newPlaylistText}>New playlist</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				{/* Private Playlist Section */}
				{privatePlaylist?.length > 0 && (
					<View style={styles.sectionContainer}>
						{privatePlaylist.map((item: any) => (
							<View key={item.id}>{renderPlaylistItem({ item })}</View>
						))}
					</View>
				)}

				{/* Public Playlists Section with Sort */}
				<View style={styles.sectionContainer}>
					{renderSortDropdown()}
					{getSortedPublicPlaylists()?.map((item: any) => (
						<View key={item.id}>{renderPlaylistItem({ item })}</View>
					))}
				</View>
			</View>

			<View style={styles.footer}>
				<TouchableOpacity style={styles.doneButton} onPress={handleDone}>
					<Typography size={16} weight="600" style={styles.doneButtonText}>
						Done
					</Typography>
				</TouchableOpacity>
			</View>

			{/* Sort Options Modal */}
			<Modal visible={showSortModal} transparent={true} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
				<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
					<View style={[styles.modalContent, { backgroundColor: Colors[theme].background }]}>
						{SORT_OPTIONS.map((option) => (
							<TouchableOpacity key={option.id} style={styles.sortOption} onPress={() => selectSortOption(option.id)}>
								<Typography size={16} weight={sortBy === option.id ? "600" : "400"}>
									{option.label}
								</Typography>
								{sortBy === option.id && <RemixIcon name="check-line" size={20} color="#00D26A" />}
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	lefticons: {
		flexDirection: "row",
		alignItems: "center",
		gap: 20,
	},
	newPlaylistText: {
		color: "#00A3FF",
		fontSize: 14,
		fontWeight: "500",
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		marginTop: 45,
	},
	sectionContainer: {
		marginBottom: 20,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginVertical: 10,
	},
	sortDropdown: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4,
	},
	sortText: {
		marginRight: 4,
		color: "#666",
	},
	playlistItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 0.5,
		borderBottomColor: "rgba(0,0,0,0.05)",
	},
	thumbnailContainer: {
		width: 50,
		height: 50,
		borderRadius: 100,
		overflow: "hidden",
		marginRight: 16,
	},
	thumbnail: {
		width: "100%",
		height: "100%",
		borderRadius: 22,
	},
	playlistTextContainer: {
		flex: 1,
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	lockIcon: {
		marginLeft: 6,
	},
	checkboxContainer: {
		paddingHorizontal: 4,
		alignItems: "flex-end",
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 100,
		borderWidth: 1.5,
		borderColor: "#000",
		backgroundColor: "#FFFFFF",
	},
	checkboxOuterSelected: {
		width: 20,
		height: 20,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	checkboxInnerSelected: {
		width: 14,
		height: 14,
		borderRadius: 8,
		backgroundColor: "#00D26A",
	},
	footer: {
		padding: 16,
		paddingBottom: 32,
	},
	doneButton: {
		backgroundColor: "#00D26A",
		borderRadius: 18,
		height: 49,
		justifyContent: "center",
		alignItems: "center",
	},
	doneButtonText: {
		color: "#FFFFFF",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		width: "80%",
		borderRadius: 12,
		padding: 16,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	sortOption: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
	},
});