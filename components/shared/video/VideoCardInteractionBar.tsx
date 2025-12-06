import { View, TouchableOpacity, StyleSheet } from "react-native";
import React, { memo, useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { ActionButtonProps, VideoCardInteractionBarProps } from "../../../helpers/types/feed/types";
import { Colors } from "@/constants";

const styles = StyleSheet.create({
  interactionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

// Memoized ActionButton component with PureComponent behavior
export const ActionButton = memo(
  ({ icon, color, count, onPress, testID }: ActionButtonProps) => (
    <TouchableOpacity
      style={styles.interactionButton}
      onPress={onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={color} />
      {count > 0 && (
        <Typography weight="400" color={color} textType="text">
          {count}
        </Typography>
      )}
    </TouchableOpacity>
  )
);

export const VideoCardInteractionBar = memo(
  ({
    likeIcon: initialLikeIcon,
    likeColor: initialLikeColor,
    likeCount: initialLikeCount,
    textColor,
    commentCount,
    onLikePress,
    onCommentPress,
    onPlayPress,
    onBookmarkPress,
    onSharePress,
    bookmarkIcon: initialBookmarkIcon,
    bookmarkColor: initialBookmarkColor,
    isBookmarked: initialIsBookmarked,
    isCommentsAllowed = true
  }: VideoCardInteractionBarProps) => {
    // Local state for optimistic updates
    const [likeIcon, setLikeIcon] = useState(initialLikeIcon);
    const [likeColor, setLikeColor] = useState(initialLikeColor);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [bookmarkIcon, setBookmarkIcon] = useState(initialBookmarkIcon);
    const [bookmarkColor, setBookmarkColor] = useState(initialBookmarkColor);
    
    // Update local state when props change
    useEffect(() => {
      setLikeIcon(initialLikeIcon);
      setLikeColor(initialLikeColor);
      setLikeCount(initialLikeCount);
      setBookmarkIcon(initialBookmarkIcon);
      setBookmarkColor(initialBookmarkColor);
    }, [initialLikeIcon, initialLikeColor, initialLikeCount, initialBookmarkIcon, initialBookmarkColor]);
    
    // Handle like press with optimistic update
    const handleLikePress = () => {
      // Toggle like state optimistically
      const isCurrentlyLiked = likeIcon === "heart";
      
      // Update UI immediately
      setLikeIcon(isCurrentlyLiked ? "heart-outline" : "heart");
      setLikeColor(isCurrentlyLiked ? textColor : "#ff0066");
      setLikeCount(isCurrentlyLiked ? Math.max(0, likeCount - 1) : likeCount + 1);
      
      // Call the actual like function
      onLikePress();
    };
    
    // Handle bookmark press with optimistic update
    const handleBookmarkPress = () => {
      // Toggle bookmark state
      const isCurrentlyBookmarked = bookmarkIcon === "bookmark";
      
      // Update UI immediately
      setBookmarkIcon(isCurrentlyBookmarked ? "bookmark-outline" : "bookmark");
      setBookmarkColor(isCurrentlyBookmarked ? textColor : Colors.general.primary);
      
      // Call the actual bookmark function
      onBookmarkPress();
    };
    
    return (
      <View style={styles.interactionContainer}>
        <View style={styles.rowContainer}>
          <ActionButton
            icon={likeIcon}
            color={likeColor}
            count={likeCount}
            onPress={handleLikePress}
            testID="like-button"
          />
          {isCommentsAllowed && (
            <ActionButton
              icon="chatbubble-outline"
              color={textColor}
              count={commentCount}
              onPress={onCommentPress}
              testID="comment-button"
            />
          )}
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={handleBookmarkPress} testID="bookmark-button">
            <Ionicons
              name={bookmarkIcon || "bookmark-outline"}
              size={20}
              color={bookmarkColor || textColor}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={onSharePress} testID="share-button">
            <Image source={Icons.share} style={{ width: 20, height: 20, tintColor: textColor }} />
          </TouchableOpacity> */}
         
        </View>
      </View>
    );
  }
);