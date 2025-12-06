import { View, Image, FlatList, Text } from "react-native";
import React, { useCallback, useState } from "react";
import Wrapper from "@/components/utilities/Wrapper2";
import Typography from "@/components/ui/Typography/Typography";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import BackButton from "@/components/utilities/BackButton";
import { Colors, Images } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import AppMenu from "@/components/ui/AppMenu";
import VideoCard from "@/components/shared/home/VideoCard";
import { router } from "expo-router";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import VideoCardSkeleton from "@/components/shared/home/VideoCardSkeleton";
import useBookmarkPost from "@/hooks/feeds/useBookmarkPost";
import EmptyList from "@/components/shared/EmptyList";
import { useGetVideoItemStore } from "@/store/feedStore";
import { usePlaylistStore } from "@/store/playlistStore";
import { useVideoAutoplay } from "@/hooks/feeds/useVideoAutoplay";
import { useFocusEffect } from "@react-navigation/native";
import useAuth from "@/hooks/auth/useAuth";
import { useProfilePic } from "@/hooks/auth/useProfilePic";
import Avatar from "@/components/ui/Avatar";

const filters = [
	{ name: "Latest", value: "latest" },
	{ name: "Oldest", value: "oldest" },
	{ name: "Most Popular", value: "most_popular" },
	{ name: "Most Recent", value: "most_recent" },
];

const SavedVideos = () => {
	const { theme } = useCustomTheme();
	const [filter, setFilter] = useState("Latest");
	const { setSelectedItem } = useGetVideoItemStore();
	const { setPlaylist } = usePlaylistStore();
	const { userDetails } = useAuth();
	const { profilePic } = useProfilePic();

	// Autoplay system integration
	const {
		handleViewableItemsChanged,
		viewabilityConfig,
		isVideoPlaying,
		currentPlayingId,
		cleanup: cleanupAutoplay,
	} = useVideoAutoplay();

	// Using an empty string as we're not bookmarking a specific post here,
	// just retrieving all bookmarked posts
	const { isPendingBookmark, refetchBookmark, bookmarkedPosts } = useBookmarkPost("");

	const bookmarkedPostsData = bookmarkedPosts?.data || [];

	// Filter out only the corrupted items without _id
	const validMedia = Array.isArray(bookmarkedPostsData) ?
		bookmarkedPostsData.filter((item: any) => item && item._id) : [];
	const mediaCount = validMedia.length;

	// Cleanup autoplay when screen loses focus
	useFocusEffect(
		useCallback(() => {
			// Screen is focused - autoplay can resume naturally
			return () => {
				// Screen is losing focus - stop all autoplay immediately
				cleanupAutoplay();
			};
		}, [cleanupAutoplay])
	);

	// Function to handle individual media press
	const handleMediaPress = (mediaItem: any, mediaIndex?: number) => {
		// Determine if this is a photo or video
		const isPhoto = mediaItem.images && mediaItem.images.length > 0 && !mediaItem.videoUrl;

		// Set the selected item in the global store
		setSelectedItem(mediaItem);

		// Set up playlist context with videos only (for video posts)
		if (!isPhoto) {
			const videosOnly = validMedia.filter((item: { videoUrl: any; }) => item.videoUrl);
			if (videosOnly.length > 0) {
				const startIndex = videosOnly.findIndex((v: { _id: any; }) => v._id === mediaItem._id);
				setPlaylist(videosOnly, Math.max(0, startIndex), 'saved-videos');
			}
		}

		// Navigate to appropriate viewer
		if (isPhoto) {
			// For photos, navigate to tabs - PhotoViewerModal will show automatically
			router.push("/(tabs)");
		} else {
			router.push("/(home)/VideoPlayer");
		}
	};

	// Function to play all saved videos
	const handlePlayAll = () => {
		const videosOnly = validMedia.filter((item: { videoUrl: any; }) => item.videoUrl);
		if (videosOnly.length > 0) {
			const firstVideo = videosOnly[0];

			// Enable auto-play when setting up playlist
			setPlaylist(videosOnly, 0, 'saved-videos', true);
			setSelectedItem(firstVideo);
			router.push("/(home)/VideoPlayer");
		}
	};

	return (
		<Wrapper>
			<View style={{ flex: 1 }}>
				<View style={{ marginTop: 16, marginHorizontal: 16 }}>
					{/* Top row with back button and avatar/name */}
					<View style={{ flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 16 }}>
						<BackButton />
						<Typography weight="600" textType="carter" size={24}>
							Saved
						</Typography>
						<View style={{ width: 40 }} />
					</View>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
						<Avatar
							imageSource={profilePic}
							uri={true}
							size={35}
							ringThickness={1}
						/>
						<Typography weight="600" textType="text" size={16}>
							{userDetails?.firstName && userDetails?.lastName
								? `${userDetails.firstName} ${userDetails.lastName}`
								: userDetails?.username || 'User'
							}
						</Typography>
					</View>

				</View>

				<View
					style={{
						flexDirection: "row",
						width: "100%",
						justifyContent: "space-between",
						alignItems: "center",
						paddingVertical: 12,
						paddingHorizontal: 16
					}}>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
						<View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
							<View style={{ width: 6, height: 6, backgroundColor: "#6E6E6E", borderRadius: 3 }} />
							<Typography>{mediaCount} {mediaCount === 1 ? 'item' : 'items'}</Typography>
						</View>
						<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
							<Ionicons name="lock-closed" size={14} color="#6E6E6E" />
							<Typography size={14} color="#6E6E6E">Private</Typography>
						</View>
					</View>

					{/* Play All Button - only show if there are videos */}
					{(() => {
						const videoCount = validMedia.filter((item: { videoUrl: any; }) => item.videoUrl).length;
						return videoCount > 0 ? (
							<View style={{ alignItems: 'flex-end' }}>
								<AppButton
									variant="compact"
									title="Play videos"
									handlePress={handlePlayAll}
									disabled={false}
								/>
							</View>
						) : (
							<View style={{ width: 80 }} />
						);
					})()}
				</View>

				<FlatList
					style={{ flex: 1 }}
					data={validMedia}
					renderItem={({ item, index }) => {
						console.log(`SavedVideos renderItem ${index}:`, {
							id: item._id,
							hasImages: !!item?.images?.length,
							hasVideo: !!item?.videoUrl,
							type: item?.videoUrl ? 'video' : 'photo'
						});

						const isAutoPlaying = isVideoPlaying(item._id);

						return (
							<View style={{ minHeight: 400, marginBottom: 16 }}>
								<VideoCard
									video={item}
									onPress={() => handleMediaPress(item, index)}
									onDeleteSuccess={refetchBookmark}
									galleryRefetch={refetchBookmark}
									isAutoPlaying={isAutoPlaying}
								/>
							</View>
						);
					}}
					keyExtractor={(item, index) => item?._id || `bookmark-${index}`}
					showsVerticalScrollIndicator={false}
					onViewableItemsChanged={handleViewableItemsChanged}
					viewabilityConfig={viewabilityConfig}
				/>
			</View>
		</Wrapper>
	);
};

export default SavedVideos;