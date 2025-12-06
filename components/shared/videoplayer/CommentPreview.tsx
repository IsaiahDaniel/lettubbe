import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface TopComment {
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
  likes: string[];
}

interface CommentPreviewProps {
  comments: TopComment[] | undefined;
  commentCount: number;
  onPress: () => void;
  onAvatarPress: (userId: string) => void;
}

const CommentPreview: React.FC<CommentPreviewProps> = ({
  comments,
  commentCount,
  onPress,
  onAvatarPress,
}) => {
  const { theme } = useCustomTheme();

  // Truncate text function
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "No comment text";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Early return if no comments
  if (commentCount === 0) {
    return null;
  }

  if (!comments || comments.length === 0) {
    return null;
  }

  const topComment = comments[0];

  // Additional safety check for user data
  if (!topComment.user) {
    return null;
  }

  // Handle avatar press
  const handleAvatarPress = () => {
    if (topComment?.user?._id) {
      onAvatarPress(topComment.user._id);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[theme].cardBackground },
      ]}
    >
      {/* Top Comment Section */}
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
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 12,
    marginHorizontal: 16,
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

export default CommentPreview;