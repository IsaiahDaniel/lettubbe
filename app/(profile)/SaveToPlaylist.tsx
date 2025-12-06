import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import BackButton from "@/components/utilities/BackButton";
import usePlaylist from "@/hooks/profile/usePlaylist";
import { useVideoPlaylistActions } from "@/hooks/profile/useVideoPlaylistActions";

// Sort options for the dropdown
const SORT_OPTIONS = [
  { id: "all", label: "All" },
  { id: "recent", label: "Recently added" },
  { id: "alpha", label: "Alphabetical" },
  { id: "played", label: "Recently played" },
];

export default function SaveToPlaylistScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();

  // Get parameters from route
  const { 
    videoId, 
    newPlaylistId, 
    refresh,
    source // 'upload' | 'videocard' | 'profile' - determine navigation flow
  } = useLocalSearchParams<{
    videoId: string;
    newPlaylistId?: string;
    refresh?: string;
    source?: string;
  }>();

  // State management
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("all");
  const [showSortModal, setShowSortModal] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch playlists
  const { allPlaylists, playlistLoading, refetchPlaylist } = usePlaylist();

  const {
    addPostToPlaylist,
    isPending: isAddingToPlaylist,
    addedPosts,
    isPostAddedToPlaylist,
  } = useVideoPlaylistActions({
    onSuccess: (postId, playlistId) => {
      // console.log(
      //   `Video ${postId} added to playlist ${playlistId} successfully`
      // );
    },
    onError: (error, postId, playlistId) => {
      console.error(
        `Error adding video ${postId} to playlist ${playlistId}:`,
        error
      );
    },
  });

  const isLoading = playlistLoading || isAddingToPlaylist || isSaving;

  // Handle refresh and new playlist selection
  useEffect(() => {
    if (refresh === "true") {
      console.log("Refreshing playlists due to new playlist creation");
      refetchPlaylist();
    }
  }, [refresh, refetchPlaylist]);

  // Auto-select newly created playlist
  useEffect(() => {
    if (newPlaylistId && allPlaylists?.data?.data) {
      console.log("Auto-selecting new playlist:", newPlaylistId);
      setSelectedPlaylists((prev) => {
        if (!prev.includes(newPlaylistId)) {
          return [...prev, newPlaylistId];
        }
        return prev;
      });
    }
  }, [newPlaylistId, allPlaylists]);

  // Save to multiple playlists when Done is pressed
  const handleDone = async () => {
    if (!videoId || selectedPlaylists.length === 0) {
      handleNavigation();
      return;
    }

    try {
      setIsSaving(true);
      setSaveComplete(false);

      // console.log(
      //   `Starting to save video ${videoId} to ${selectedPlaylists.length} playlists`
      // );

      // Process one playlist at a time instead of all in parallel
      for (const playlistId of selectedPlaylists) {
        // Check if this post is already added to this playlist to avoid duplicates
        const isAlreadyAdded = isPostAddedToPlaylist(videoId, playlistId);

        if (isAlreadyAdded) {
          console.log(
            `Video ${videoId} is already in playlist ${playlistId}, skipping`
          );
          continue;
        }

        // Add to playlist and await each operation
        // console.log(`Adding video ${videoId} to playlist ${playlistId}`);
        await addPostToPlaylist(videoId, playlistId);
        // console.log(
        //   `Successfully added video ${videoId} to playlist ${playlistId}`
        // );
      }

      // Once all operations complete successfully
      setSaveComplete(true);
      setIsSaving(false);

      // console.log("Video added to all selected playlists successfully");

      // Show success message
      Alert.alert(
        "Success",
        `Video added to ${selectedPlaylists.length} playlist${
          selectedPlaylists.length > 1 ? "s" : ""
        }`,
        [{ 
          text: "OK", 
          onPress: () => handleNavigation()
        }]
      );
    } catch (error) {
      console.error("Error adding video to playlists:", error);
      setIsSaving(false);

      // Show error message
      Alert.alert(
        "Error",
        "Failed to add video to some playlists. Please try again.",
        [{ text: "OK", onPress: () => handleNavigation() }]
      );
    }
  };

  // Centralized navigation logic
  const handleNavigation = () => {
    switch (source) {
      case "upload":
        // If coming from upload flow, to continue upload process
        router.back();
        break;
      case "videocard":
        // If coming from video card, go back to the video
        router.back();
        break;
      case "profile":
        // If coming from profile, go back to profile
        router.back();
        break;
      default:
        // Default behavior
        router.back();
        break;
    }
  };

  const handleNewPlaylist = () => {
    // Pass source information to CreatePlaylist
    router.push({
      pathname: "/(profile)/CreatePlaylist" as any,
      params: {
        returnTo: "/(profile)/SaveToPlaylist",
        videoId,
        source: source || "default",
      },
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
  const privatePlaylist = allPlaylists?.data?.data.filter(
    (playlist: any) => playlist.visibility === "private"
  );

  // Get sorted public playlists based on selected sort option
  const getSortedPublicPlaylists = () => {
    if (!allPlaylists?.data?.data) return [];

    let publicPlaylists = allPlaylists.data.data.filter(
      (playlist: any) => playlist.visibility !== "private"
    );

    switch (sortBy) {
      case "alpha":
        publicPlaylists.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case "recent":
        // Sort by creation date if available
        publicPlaylists.sort((a: any, b: any) => 
          new Date(b.createdAt || b.created_at || 0).getTime() - 
          new Date(a.createdAt || a.created_at || 0).getTime()
        );
        break;
      case "played":
        // Sort by last played if available, fallback to creation date
        publicPlaylists.sort((a: any, b: any) => 
          new Date(b.lastPlayed || b.createdAt || 0).getTime() - 
          new Date(a.lastPlayed || a.createdAt || 0).getTime()
        );
        break;
      default:
        // 'all' - keep original order
        break;
    }

    return publicPlaylists;
  };

  const renderPlaylistItem = ({ item }: { item: any }) => {
    const isSelected = selectedPlaylists.includes(item._id);
    // Use the hook's method to check if post is already added
    const isAlreadyAdded = videoId && isPostAddedToPlaylist(videoId, item._id);
    // Highlight newly created playlist
    const isNewlyCreated = item._id === newPlaylistId;

    return (
      <TouchableOpacity
        style={[
          styles.playlistItem,
          isNewlyCreated && styles.newPlaylistHighlight,
        ]}
        key={item._id}
        onPress={() => togglePlaylist(item._id)}
        disabled={!!(isLoading || isAlreadyAdded)}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={item.coverPhoto ? { uri: item.coverPhoto } : Images.avatar}
            style={styles.thumbnail}
          />
        </View>

        <View style={styles.playlistTextContainer}>
          <View style={styles.nameContainer}>
            <Typography size={16} weight="500">
              {item.name}
              {isNewlyCreated && (
                <Typography size={12} weight="400" style={styles.newBadge}>
                  {" "}
                  • New
                </Typography>
              )}
            </Typography>
            {item.visibility === "private" && (
              <RemixIcon
                name="lock-line"
                size={16}
                color="#666"
                style={styles.lockIcon}
              />
            )}
          </View>

          <Typography size={14} weight="400" textType="secondary">
            {item?.videos?.length || 0}{" "}
            {item?.videos?.length <= 1 ? "video" : "videos"}
            {isAlreadyAdded && " • Already added"}
          </Typography>
        </View>

        <View style={styles.checkboxContainer}>
          {isAlreadyAdded ? (
            <RemixIcon name="check-line" size={20} color="#00D26A" />
          ) : isSelected ? (
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
      <TouchableOpacity
        style={styles.sortDropdown}
        onPress={toggleSortModal}
        disabled={!!isLoading}
      >
        <Typography size={14} weight="500" style={styles.sortText}>
          {SORT_OPTIONS.find((option) => option.id === sortBy)?.label || "All"}
        </Typography>
        <RemixIcon name="arrow-down-line" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  // Debug
  useEffect(() => {
    console.log("SaveToPlaylistScreen mounted with:", {
      videoId,
      newPlaylistId,
      refresh,
      source
    });
  }, [videoId, newPlaylistId, refresh, source]);

  if (playlistLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <View style={styles.lefticons}>
            <BackButton />
            <Typography size={17} weight="600">
              Add to playlist
            </Typography>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D26A" />
          <Typography size={16} weight="500" style={{ marginTop: 12 }}>
            Loading playlists...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.lefticons}>
          <BackButton />
          <Typography size={17} weight="600">
            Add to playlist
          </Typography>
        </View>
        <TouchableOpacity onPress={handleNewPlaylist} disabled={!!isLoading}>
          <Text
            style={[styles.newPlaylistText, isLoading && styles.disabledText]}
          >
            New playlist
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Private Playlist Section */}
        {privatePlaylist && privatePlaylist.length > 0 && (
          <View style={styles.sectionContainer}>
            <Typography size={15} weight="500" style={styles.sectionTitle}>
              Private Playlists
            </Typography>
            {privatePlaylist.map((item: any) => (
              <View key={item._id}>{renderPlaylistItem({ item })}</View>
            ))}
          </View>
        )}

        {/* Public Playlists Section with Sort */}
        <View style={styles.sectionContainer}>
          {renderSortDropdown()}
          {getSortedPublicPlaylists()?.map((item: any) => (
            <View key={item._id}>{renderPlaylistItem({ item })}</View>
          ))}
          
          {/* Empty state */}
          {(!allPlaylists?.data?.data || allPlaylists.data.data.length === 0) && (
            <View>
              <Typography size={16} weight="400" textType="secondary">
                No playlists yet. Create your first playlist!
              </Typography>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.doneButton,
            isLoading && styles.disabledButton,
            selectedPlaylists.length === 0 && styles.disabledButton,
          ]}
          onPress={handleDone}
          disabled={!!(isLoading || selectedPlaylists.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Typography size={16} weight="600" style={styles.doneButtonText}>
              Done ({selectedPlaylists.length})
            </Typography>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Options Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors[theme].background },
            ]}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.sortOption}
                onPress={() => selectSortOption(option.id)}
              >
                <Typography
                  size={16}
                  weight={sortBy === option.id ? "600" : "400"}
                >
                  {option.label}
                </Typography>
                {sortBy === option.id && (
                  <RemixIcon name="check-line" size={20} color="#00D26A" />
                )}
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
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 5,
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
  newPlaylistHighlight: {
    backgroundColor: "rgba(0, 211, 106, 0.05)",
    borderRadius: 8,
    marginVertical: 2,
    paddingHorizontal: 8,
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
  newBadge: {
    color: "#00D26A",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "#cccccc",
  },
});