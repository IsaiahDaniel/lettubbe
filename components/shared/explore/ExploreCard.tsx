import React from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Post } from "@/helpers/types/explore/explore";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { formatNumber, formatTimeAgo } from "@/helpers/utils/formatting";
import { CommentButton } from "@/components/shared/interactions/CommentButton";
import { ViewButton } from "@/components/shared/interactions/ViewButton";
import { LikeButton } from "@/components/shared/interactions/LikeButton";
import TransitionThumbnail from "../../transitions/TransitionThumbnail";
import { router } from "expo-router";
import { useGetVideoItemStore } from "@/store/feedStore";

export interface ExploreCardProps {
  item: Post;
  onPress?: (item: Post) => void;
  onCommentPress?: (item: Post) => void;
}

const ExploreCard: React.FC<ExploreCardProps> = ({
  item,
  onPress,
  onCommentPress,
}) => {
  const { theme } = useCustomTheme();
  const { setSelectedItem } = useGetVideoItemStore();
  
  // Determine if this is a photo post
  const isPhotoPost = item.images && item.images.length > 0;

  // Enable LayoutAnimation on Android
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  const handlePress = () => {
    if (isPhotoPost) {
      // Create media item for photo viewer
      const mediaItem = {
        _id: item._id,
        thumbnail: item.thumbnail,
        duration: item.duration?.toString() || "",
        description: item.description || "",
        videoUrl: "",
        photoUrl: item.images?.[0] || item.thumbnail || "",
        images: item.images || [],
        mediaType: 'photo' as const,
        createdAt: item.createdAt,
        comments: [],
        reactions: {
          likes: []
        },
        viewCount: item.views || item.totalViews || 0,
        commentCount: item.comments || 0,
        isCommentsAllowed: item.isCommentsAllowed ?? true,
        user: {
          username: item.user?.username || "",
          subscribers: [],
          _id: item.user?.id || "",
          firstName: item.user?.firstName || "",
          lastName: item.user?.lastName || "",
          profilePicture: item.user?.avatar || ""
        },
      };

      // Set the selected item in the store
      setSelectedItem(mediaItem);

      // Navigate to tabs - PhotoViewerModal will show automatically
      router.push("/(tabs)");
    } else {
      if (onPress) onPress(item);
    }
  };

  const handleCommentPress = () => {
    if (onCommentPress) onCommentPress(item);
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes < 10 ? "0" : ""}${remainingMinutes}:${
        remainingSeconds < 10 ? "0" : ""
      }${remainingSeconds}`;
    }

    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.container}
      >
        <TransitionThumbnail 
          onPress={handlePress} 
          style={isPhotoPost ? styles.photoThumbnail : styles.thumbnail}
        >
          <ImageBackground
            source={{
              uri: isPhotoPost && item.images && item.images[0]
                ? item.images[0]
                : item.thumbnail
            }}
            style={isPhotoPost ? styles.photoThumbnail : styles.thumbnail}
            imageStyle={styles.thumbnailImage}
          >
            {item.images && item.images.length > 1 ? (
              <View style={styles.photoBadge}>
                <Typography size={12} color="#fff">
                  {item.images.length}
                </Typography>
              </View>
            ) : item.duration > 0 ? (
              <View style={styles.durationBadge}>
                <Typography size={12} color="#fff">
                  {formatDuration(item.duration)}
                </Typography>
              </View>
            ) : null}
          </ImageBackground>
        </TransitionThumbnail>

        <View style={styles.contentContainer}>
          <View style={styles.infoContainer}>
            {item.user && (
              <Typography
                textType="textBold"
                weight="600"
                size={16}
                numberOfLines={1}
                style={styles.username}
              >
                {item.user.fullName || ""}
              </Typography>
            )}
            <Typography textType="secondary" size={14} numberOfLines={2}>
              {item.description || ""}
            </Typography>

            <View style={styles.statsContainer}>
              <ViewButton
                viewsCount={formatNumber(item.totalViews || 0)}
                textColor={Colors[theme].textLight}
                disabled={true}
                iconSize={14}
              />

              <LikeButton
                postId={item.id}
                likeCount={item.likes}
                textColor={Colors[theme].textLight}
                size={14}
                showCount={true}
              />

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleCommentPress();
                }}
              >
                <CommentButton
                  commentCount={item.comments || 0}
                  textColor={Colors[theme].textLight}
                  onPress={handleCommentPress}
                  size={14}
                  showCount={true}
                />
              </TouchableOpacity>

              {item.createdAt && (
                <Typography size={12} color={Colors[theme].textLight}>
                  {formatTimeAgo(new Date(item.createdAt).getTime())}
                </Typography>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Separator Line */}
      <View style={[styles.separator, { backgroundColor: Colors[theme].cardBackground }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    paddingVertical: 12,
  },
  thumbnail: {
    width: 140,
    height: 94,
    justifyContent: "flex-end",
  },
  photoThumbnail: {
    width: 140,
    height: 175,
    justifyContent: "flex-end",
  },
  thumbnailImage: {
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 12,
  },
  durationBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  photoBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
});

export default ExploreCard;
