import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { LikeButton } from "./LikeButton";
import { CommentButton } from "./CommentButton";
import { BookmarkButton } from "./BookmarkButton";
import { ShareButton } from "./ShareButton";
import { ViewButton } from "./ViewButton";
import { useInteractionStore } from "@/hooks/interactions/useInteractionStore";

interface GlobalInteractionBarProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  playsCount: number;
  textColor: string;
  onCommentPress: () => void;
  onSharePress: () => void;
  onPlayPress?: () => void;
  galleryRefetch?: () => Promise<any>;
  showCount?: boolean; // prop to control count visibility
  isCommentsAllowed?: boolean; // prop to control comment button visibility
  isPhotoPost?: boolean;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export const GlobalInteractionBar = memo(
  ({
    postId,
    likeCount,
    commentCount,
    playsCount,
    textColor,
    onCommentPress,
    onSharePress,
    onPlayPress,
    galleryRefetch,
    showCount = true,
    isCommentsAllowed = true,
    isPhotoPost = false,
  }: GlobalInteractionBarProps) => {
    // Get plays count from the store (will show updated count)
    const { getPlaysCount } = useInteractionStore();
    const currentPlaysCount = getPlaysCount(postId) || playsCount;

    return (
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <LikeButton
            postId={postId}
            likeCount={likeCount}
            textColor={textColor}
            galleryRefetch={galleryRefetch}
            showCount={showCount}
          />
          {isCommentsAllowed && (
            <CommentButton
              commentCount={commentCount}
              textColor={textColor}
              onPress={onCommentPress}
              showCount={showCount}
            />
          )}
          <ViewButton
            viewsCount={currentPlaysCount}
            textColor={textColor}
            onPress={onPlayPress}
            isPhotoPost={isPhotoPost}
          />
        </View>
        <View style={styles.rightContainer}>
          <BookmarkButton
            postId={postId}
            textColor={textColor}
            galleryRefetch={galleryRefetch}
          />
          <ShareButton textColor={textColor} onPress={onSharePress} />
        </View>
      </View>
    );
  }
);
