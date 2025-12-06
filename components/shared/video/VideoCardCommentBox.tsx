import { View, TouchableOpacity, StyleSheet } from "react-native";
import React, { memo, useMemo } from "react";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import { VideoCardCommentBoxProps } from "../../../helpers/types/feed/types";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  createdAt: string;
  likes?: string[];
}

interface EnhancedVideoCardCommentBoxProps extends VideoCardCommentBoxProps {
  comments?: Comment[];
  onAvatarPress?: (userId: string) => void;
}

const styles = StyleSheet.create({
  commentBox: {
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  topCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    marginLeft: 2,
  },
  viewAllContainer: {
    paddingLeft: 4,
  },
});

export const VideoCardCommentBox = memo(
  ({
    commentCount,
    onPress,
    backgroundColor,
    comments = [],
    onAvatarPress,
  }: EnhancedVideoCardCommentBoxProps) => {
    const { theme } = useCustomTheme();

    // Get the most recent comment (since comments are already sorted by createdAt)
    const topComment = useMemo(() => {
      if (!comments || comments.length === 0) {
        return null;
      }

      // Return the first comment (most recent due to sorting in useGetComments)
      return comments[0];
    }, [comments]);

    // Handle avatar press
    const handleAvatarPress = () => {
      if (onAvatarPress && topComment?.user?._id) {
        onAvatarPress(topComment.user._id);
      }
    };

    // Truncate text
    const truncateText = (text: string, maxLength: number = 100) => {
      if (!text) return "No comment text";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + "...";
    };

    // Early return if no comments
    if (commentCount === 0) {
      return null;
    }

    return (
      <View style={[styles.commentBox, { backgroundColor }]}>
        {/* Top Comment Section */}
        {topComment ? (
          <TouchableOpacity
            style={styles.topCommentContainer}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
              <Avatar
                imageSource={
                  topComment.user?.profilePicture ||
                  ""
                }
                uri={true}
                size={32}
                ringColor={Colors[theme].avatar}
                gapSize={2}
                showRing={true}
                expandable={false}
              />
            </TouchableOpacity>

            <View style={styles.commentContent}>
              <View style={styles.commentText}>
                <Typography weight="400" size={13} textType="textBold">
                  {truncateText(topComment.text)}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ padding: 10 }}>
            <Typography size={12} textType="secondary">
              ...
            </Typography>
          </View>
        )}

        {/* View All Comments Section */}
        <View style={styles.viewAllContainer}>
          <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Typography weight="400" size={12} textType="secondary">
              View all {commentCount} comments
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);
