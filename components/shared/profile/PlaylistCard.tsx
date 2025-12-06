import { View, Image, TouchableOpacity, LayoutAnimation, UIManager, Platform } from "react-native";
import React, { useState } from "react";
import { Colors, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { Ionicons } from "@expo/vector-icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { router } from "expo-router";
import { useGlobalInteractions } from "@/hooks/interactions/useGlobalInteractions";
import { trackVideoPlay } from "@/services/feed.service";
import { useGetVideoItemStore } from "@/store/feedStore";
import TransitionThumbnail from "../../transitions/TransitionThumbnail";
import AppMenu from "@/components/ui/AppMenu";
import { useVideoPlaylistActions } from "@/hooks/profile/useVideoPlaylistActions";
import { useAlert } from "@/components/ui/AlertProvider";

const PlaylistCard = ({
  item,
  isPlaylist,
  onPress,
  playlistId,
  onRemoveSuccess,
  showRemoveOption = false,
}: {
  item: any;
  isPlaylist: boolean;
  onPress?: () => void;
  playlistId?: string;
  onRemoveSuccess?: () => void;
  showRemoveOption?: boolean;
}) => {
  const { theme } = useCustomTheme();
  const { setSelectedItem } = useGetVideoItemStore();
  const [selectedFilter, setSelectedFilter] = useState("");
  const { showConfirm, showError } = useAlert();
  
  // Video playlist actions hook for removing from playlist
  const { removePostFromPlaylist, isRemoving, removingPostId } = useVideoPlaylistActions({
    onRemoveSuccess: (postId, playlistId) => {
      console.log(`Successfully removed post ${postId} from playlist ${playlistId}`);
      if (onRemoveSuccess) {
        onRemoveSuccess();
      }
    },
    onRemoveError: (error, postId, playlistId) => {
      console.error('Failed to remove post from playlist:', error);
      showError('Error', 'Failed to remove from playlist. Please try again.');
    }
  });

  // Handle possible undefined item
  if (!item) return null;

  // Debug
  // console.log("PlaylistCard item:", JSON.stringify(item, null, 2));
  // console.log("isPlaylist:", isPlaylist);

  // Global interactions hook - for videos, not playlists
  const { handleLikePost, isLiked, isBookmarked } = useGlobalInteractions(
    item._id || item.id,
    {
      galleryRefetch: undefined,
    }
  );

  // Handle undefined cover photo
  const playlistCoverPic = item.coverPhoto
    ? { uri: item.coverPhoto }
    : Images.background;
  const playlistThumbnail = item.thumbnail
    ? { uri: item.thumbnail }
    : Images.background;

  const getUsername = () => {
    if (isPlaylist) {
      return item?.name || "Playlist";
    } else {
      return (
        item?.user?.username ||
        item?.user?.displayName ||
        item?.creator?.username ||
        item?.author?.username ||
        "Unknown User"
      );
    }
  };

  // Enable LayoutAnimation on Android
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  // Handle video play tracking and navigation
  const handleVideoPlay = async () => {
    if (!isPlaylist && item._id) {
      try {
        // Track the video play
        await trackVideoPlay(item._id);
        
        // Set the selected video in the global store
        setSelectedItem(item);
        
        router.push("/(home)/VideoPlayer");
      } catch (error) {
        console.error("Error tracking video play:", error);
      }
    }
  };

  // Handle card press - different behavior for playlists vs videos
  const handleCardPress = () => {
    if (onPress) {
      // Use custom onPress if provided
      onPress();
    } else if (isPlaylist) {
      // Navigate to playlist view for playlists
      router.push({
        pathname: "/(profile)/ViewPlaylist",
        params: {
          id: item._id || item.id,
        },
      });
    } else {
      // For videos, play the video
      handleVideoPlay();
    }
  };

  // Get like count from reactions or fallback to item.likes
  const getLikeCount = () => {
    if (!isPlaylist && item.reactions?.likes) {
      return Array.isArray(item.reactions.likes)
        ? item.reactions.likes.length
        : 0;
    }
    return item?.likes || 0;
  };

  // Get comment count
  const getCommentCount = () => {
    if (!isPlaylist && item.comments) {
      return Array.isArray(item.comments) ? item.comments.length : 0;
    }
    return item?.comments || 0;
  };

  // Get plays/views count
  const getPlaysCount = () => {
    if (!isPlaylist) {
      return item.reactions?.scrollViews || item?.plays || 0;
    }
    return item?.plays || 0;
  };

  // Check if playlist is private
  const isPrivatePlaylist = () => {
    return isPlaylist && item?.visibility?.toLowerCase() === 'private';
  };

  // Handle remove from playlist
  const handleRemoveFromPlaylist = async () => {
    if (!playlistId || !item._id) {
      showError('Error', 'Missing required information to remove from playlist.');
      return;
    }

    showConfirm(
      'Remove from Playlist',
      'Are you sure you want to remove this item from the playlist?',
      async () => {
        try {
          await removePostFromPlaylist(item._id, playlistId);
        } catch (error) {
          console.error('Error removing from playlist:', error);
        }
      },
      undefined, // onCancel - uses default behavior
      'Remove', // confirmText
      'Cancel', // cancelText
      'danger' // variant
    );
  };

  // Menu options for videos in playlists
  const getMenuOptions = () => {
    const options = [];
    
    if (showRemoveOption && !isPlaylist) {
      options.push({
        name: 'Remove from Playlist',
      });
    }
    
    return options;
  };

  // Handle menu option selection
  const handleMenuOptionSelect = (option: string) => {
    setSelectedFilter(option);
    
    switch (option) {
      case 'Remove from Playlist':
        handleRemoveFromPlaylist();
        break;
      default:
        break;
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleCardPress}
      activeOpacity={0.7}
      style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
    >
      {/* Thumbnail */}
      <View style={{ position: "relative" }}>
        {isPlaylist ? (
          // Stacked playlist design
          <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
            <View style={{ width: 140, height: 94 }}>
              {/* Back layer (top card - peeking out) */}
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  left: 3,
                  width: 134,
                  height: 91,
                  backgroundColor: Colors[theme].text,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Colors[theme].borderColor,
                  opacity: 0.7,
                  transform: [{ rotate: '-1deg' }],
                }}
              />
              
              {/* Middle layer */}
              <View
                style={{
                  position: "absolute",
                  top: -1.5,
                  left: 1.5,
                  width: 137,
                  height: 92.5,
                  backgroundColor: Colors[theme].cardBackground,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: Colors[theme].borderColor,
                  opacity: 0.85,
                  transform: [{ rotate: '-0.5deg' }],
                }}
              />
              
              {/* Front layer (main thumbnail) */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 140,
                  height: 94,
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: Colors[theme].borderColor,
                  transform: [{ rotate: '0deg' }],
                }}
              >
                <Image
                  source={playlistCoverPic}
                  style={{ width: "100%", height: "100%", borderRadius: 7 }}
                  resizeMode="cover"
                />
                
                {/* Playlist indicator overlay */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    // paddingVertical: 2,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Ionicons
                    name="list"
                    size={10}
                    color="white"
                  />
                  <Typography
                    size={10}
                    color="white"
                    weight="500"
                  >
                    {item?.videoCount || item?.videos?.length || 0}
                  </Typography>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          // Regular video thumbnail
          <TransitionThumbnail 
            onPress={handleCardPress}
            style={{ width: 140, height: 94, borderRadius: 8 }}
          >
            <Image
              source={playlistThumbnail}
              style={{ width: 140, height: 94, borderRadius: 8 }}
            />
            {/* play button overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: 20,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="play"
                  size={14}
                  color="rgba(0, 0, 0, 0.3)"
                  style={{ marginLeft: 3 }}
                />
              </View>
            </View>
          </TransitionThumbnail>
        )}
      </View>

      {/* Content details */}
      <View style={{ flex: 1, gap: 3 }}>
        {/* Username and Menu */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Typography
              weight="600"
              textType="textBold"
              size={14}
              style={{ textTransform: "capitalize" }}
            >
              {getUsername()}
            </Typography>
          </View>
          
          {/* Menu button - only show for videos when showRemoveOption is true */}
          {showRemoveOption && !isPlaylist && getMenuOptions().length > 0 && (
            <AppMenu
              width="60%"
              trigger={(isOpen) => (
                <View
                  style={{
                    padding: 4,
                    borderRadius: 12,
                  }}
                >
                  {isRemoving && removingPostId === item._id ? (
                    <Ionicons
                      name="hourglass-outline"
                      size={16}
                      color={Colors[theme].textLight}
                    />
                  ) : (
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color={Colors[theme].textLight}
                    />
                  )}
                </View>
              )}
              options={getMenuOptions()}
              selectedOption={selectedFilter}
              onSelect={handleMenuOptionSelect}
            />
          )}
        </View>

        {/* Description */}
        <Typography
          weight="400"
          size={12}
          color={Colors[theme].textLight}
          numberOfLines={2}
          style={{ lineHeight: 16 }}
        >
          {item?.description}
        </Typography>

        {/* Engagement metrics */}
        {isPlaylist ? (
          // Only show private indicator if playlist is actually private
          isPrivatePlaylist() && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  width: "auto",
                }}
              >
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={Colors[theme].text}
                />
                <Typography style={{ textTransform: "capitalize" }}>
                  Private
                </Typography>
              </View>
            </View>
          )
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 4,
            }}
          >
            {/* Likes - Using global interaction state */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              onPress={(e) => {
                e.stopPropagation();
                handleLikePost(getLikeCount());
              }}
            >
              <Ionicons
                name="heart"
                size={14}
                color={isLiked ? "#ff0066" : Colors[theme].textLight}
              />
              <Typography
                weight="500"
                size={12}
                color={Colors[theme].textLight}
              >
                {getLikeCount()}
              </Typography>
            </TouchableOpacity>

            {/* Plays */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="play" size={14} color={Colors[theme].textLight} />
              <Typography
                weight="500"
                size={12}
                color={Colors[theme].textLight}
              >
                {getPlaysCount()}
              </Typography>
            </View>

            {/* Comments */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={Colors[theme].textLight}
              />
              <Typography
                weight="500"
                size={12}
                color={Colors[theme].textLight}
              >
                {getCommentCount()}
              </Typography>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PlaylistCard;