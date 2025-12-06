import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import usePostInteractions from "@/hooks/feeds/usePostInterations";
import useAuth from "@/hooks/auth/useAuth";
import { formatTimePost } from "@/helpers/utils/util";
import Avatar from "@/components/ui/Avatar";
import CommentOptions from "./CommentOptions";
import { useDeleteComment } from "@/hooks/feeds/useDeleteComment";
import { useRouter } from "expo-router";
import { MentionText } from "@/components/ui/inputs/mentions";
import { parseMentionsFromBackend } from "@/helpers/utils/mentionUtils";

const CommentItem = ({
  comment,
  onReply,
  postId,
  isPersonalVideo = false,
  onCommentDeleted,
  onAvatarPress,
  disableAvatarPress = false,
  setShowUserProfile,
  onNavigateToReplies,
}: any) => {
  // Guard against null/undefined comment
  if (!comment) {
    console.warn('CommentItem received null comment');
    return null;
  }
  
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const router = useRouter();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const deleteCommentMutation = useDeleteComment();

  const { handleInteraction, isPending } = usePostInteractions(postId);
  const isUserLiked = comment?.likes?.includes(userDetails?._id) && userDetails?._id;
  const isOwnComment =
    userDetails?._id && comment?.user?._id && comment?.user?._id === userDetails._id;
  const hasReplies = comment?.replies && comment.replies.length > 0;
  const isCurrentUserComment = comment?.user?._id && userDetails?._id && comment?.user?._id === userDetails?._id;

  // Check if currently deleting this specific comment
  const isDeleting = deleteCommentMutation.isPending;

  // debuggin
  // useEffect(() => {
  //   console.log("CommentItem Debug Info:");
  //   console.log("isPersonalVideo:", isPersonalVideo);
  //   console.log("isOwnComment:", isOwnComment);
  //   console.log("userDetails._id:", userDetails?._id);
  //   console.log("comment.user._id:", comment?.user?._id);
  // }, [isPersonalVideo, isOwnComment, userDetails?._id, comment?.user?._id]);

  const handleAvatarPress = useCallback(() => {
    if (disableAvatarPress) {
      return;
    }

    // onAvatarPress handler takes precedence
    if (onAvatarPress) {
      onAvatarPress();
      return; // Early return to prevent other actions
    }

    // Handle current user's own comment
    if (isCurrentUserComment) {
      router.push("/(tabs)/profile");
      return; // Early return
    }

    // Handle other users' comments - show profile bottom sheet
    if (setShowUserProfile && comment?.user?._id) {
      setShowUserProfile(true, comment?.user?._id);
    }
  }, [disableAvatarPress, onAvatarPress, isCurrentUserComment, router, setShowUserProfile, comment?.user?._id]);

  const handleReplyPress = useCallback(() => {
    // Navigate to replies page with auto-focus
    if (onNavigateToReplies) {
      onNavigateToReplies(comment, true);
    } else {
      // Fallback to old behavior if navigation not available
      if (comment?._id && comment?.user?.username) {
        onReply(comment._id, comment?.user?.username);
      }
    }
  }, [onNavigateToReplies, comment, onReply]);

  const handleLongPress = (event: {
    nativeEvent: { pageX: any; pageY: any };
  }) => {
    // Capture the position of the long press
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });

    // Log options
    const options = generateOptions();

    setOptionsVisible(true);
    setIsLongPressing(false);
    // Return to normal scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    setIsLongPressing(true);
    // Scale down slightly
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isLongPressing) {
      setIsLongPressing(false);
      // Return to normal scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleViewReplies = useCallback(() => {
    if (onNavigateToReplies) {
      onNavigateToReplies(comment, false); // false = just view replies
    }
  }, [onNavigateToReplies, comment]);

  const handleReplyToComment = useCallback(() => {
    if (onNavigateToReplies) {
      onNavigateToReplies(comment, true); // true = auto-focus reply input
    }
  }, [onNavigateToReplies, comment]);

  // Updated delete handler
  const handleDeleteComment = useCallback(async (commentId: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Close the options menu
            setOptionsVisible(false);

            try {
              await deleteCommentMutation.mutateAsync({
                postId,
                commentId,
              });

              // Notify parent component that comment was deleted to update the UI
              if (onCommentDeleted) {
                onCommentDeleted(commentId);
              }
            } catch (error) {
              console.error("Delete comment failed:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [deleteCommentMutation, postId, onCommentDeleted, setOptionsVisible]);

  // Placeholder functions
  const handleShare = useCallback((commentId: string) => {
    // TODO: Implement share functionality
  }, []);

  const handleEdit = useCallback((commentId: string) => {
    // TODO: Implement edit functionality
  }, []);

  const handleReportChannel = useCallback((userId: string) => {
    // TODO: Implement report functionality
  }, []);

  const handleBlockChannel = useCallback((userId: string) => {
    // TODO: Implement block functionality
  }, []);

  const handlePinComment = useCallback((commentId: string) => {
    // TODO: Implement pin functionality
  }, []);

  const generateOptions = useCallback(() => {
    let options = [];

    // For comments on videos posted by others (not personal videos)
    if (!isPersonalVideo) {
      if (isOwnComment) {
        // User's own comments on others' videos
        options = [
          // {
          // 	id: "share",
          // 	icon: "share-social-outline",
          // 	label: "Share",
          // 	onPress: () => handleShare(comment._id),
          // },
          // {
          // 	id: "Edit",
          // 	icon: "pencil",
          // 	label: "Edit",
          // 	onPress: () => handleEdit(comment._id),
          // },
          {
            id: "delete",
            icon: "trash-outline",
            label: "Delete",
            onPress: () => comment?._id && handleDeleteComment(comment._id),
            color: Colors.general.error,
          },
        ];
      } else {
        // Other users' comments on public videos
        options = [
          // {
          // 	id: "share",
          // 	icon: "share-social-outline",
          // 	label: "Share",
          // 	onPress: () => handleShare(comment._id),
          // },
          {
            id: "report",
            icon: "flag-outline",
            label: "Report Channel",
            onPress: () => comment?.user?._id && handleReportChannel(comment.user._id),
          },
          // {
          // 	id: "block",
          // 	icon: "ban-outline",
          // 	label: "Block Channel",
          // 	onPress: () => handleBlockChannel(comment.user._id),
          // 	color: Colors.general.error,
          // },
        ];
      }
    } else {
      // For comments on personally posted videos (isPersonalVideo is true)
      if (isOwnComment) {
        // User's own comments on their own videos
        options = [
          // {
          // 	id: "pin",
          // 	icon: "pin-outline",
          // 	label: "Pin",
          // 	onPress: () => handlePinComment(comment._id),
          // },
          // {
          // 	id: "Edit",
          // 	icon: "pencil",
          // 	label: "Edit",
          // 	onPress: () => handleEdit(comment._id),
          // },
          // {
          // 	id: "share",
          // 	icon: "share-social-outline",
          // 	label: "Share",
          // 	onPress: () => handleShare(comment._id),
          // },
          {
            id: "delete",
            icon: "trash-outline",
            label: "Delete",
            onPress: () => comment?._id && handleDeleteComment(comment._id),
            color: Colors.general.error,
          },
        ];
      } else {
        // Other users' comments on the user's own videos
        options = [
          // {
          // 	id: "pin",
          // 	icon: "pin-outline",
          // 	label: "Pin",
          // 	onPress: () => handlePinComment(comment._id),
          // },
          // {
          // 	id: "share",
          // 	icon: "share-social-outline",
          // 	label: "Share",
          // 	onPress: () => handleShare(comment._id),
          // },
          // {
          // 	id: "report",
          // 	icon: "flag-outline",
          // 	label: "Report Channel",
          // 	onPress: () => handleReportChannel(comment.user._id),
          // },
          // {
          // 	id: "block",
          // 	icon: "ban-outline",
          // 	label: "Block Channel",
          // 	onPress: () => handleBlockChannel(comment.user._id),
          // },
          {
            id: "delete",
            icon: "trash-outline",
            label: "Delete",
            onPress: () => comment?._id && handleDeleteComment(comment._id),
            color: Colors.general.error,
          },
        ];
      }
    }

    return options;
  }, [isPersonalVideo, isOwnComment, comment?._id, comment?.user?._id, handleDeleteComment, handleReportChannel]);

  // Functions have been moved above generateOptions

  // If the comment is being deleted, show a faded look
  const commentOpacity = isDeleting ? 0.5 : 1;

  return (
    <Animated.View
      style={[
        styles.commentContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: commentOpacity,
        },
      ]}
    >
      <View style={styles.commentWrapper}>
        <View style={styles.avatarColumn}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
            <Avatar
              imageSource={
                comment?.user?.profilePicture ||
                comment?.profilePicture ||
                "https://i.stack.imgur.com/l60Hf.png"
              }
              uri={true}
              size={30}
              ringColor={Colors[theme].avatar}
              gapSize={2.4}
              showRing={false}
              expandable={false}
            />
          </TouchableOpacity>

        </View>

        {/* Comment Content Column */}
        <View style={styles.contentColumn}>
          <Pressable
            style={{ flex: 1 }}
            key={comment?._id}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={400}
            disabled={isDeleting} // Disable interactions when deleting
          >
            <View style={styles.commentContent}>
              <View style={styles.userInfoContainer}>
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  activeOpacity={0.7}
                >
                  <Typography
                    weight="500"
                    size={12}
                    textType="textBold"
                    style={{ textTransform: "capitalize" }}
                  >
                    {comment?.user?.username}
                  </Typography>
                </TouchableOpacity>
                {comment.fromCommunity && (
                  <Typography size={14} color={Colors.general.blue}>
                    {" "}
                    from {comment.fromCommunity}
                  </Typography>
                )}
                <Typography size={12} color="#BFBFBF" style={{ flex: 1 }}>
                  {formatTimePost(comment?.createdAt)}
                </Typography>
              </View>
              <View style={styles.commentTextContainer}>
                <MentionText
                  text={comment.text}
                  mentions={parseMentionsFromBackend(comment.text, comment.mentions || []).mentions}
                  size={13}
                  weight="400"
                  color={Colors[theme].textBold}
                  onUserProfilePress={(userId) => {
                    if (userId === userDetails?._id) {
                      router.push("/(tabs)/profile");
                    } else if (setShowUserProfile) {
                      setShowUserProfile(true, userId);
                    }
                  }}
                />
                {comment.isOptimistic && (
                  <View style={styles.optimisticIndicator}>
                    <Typography size={12} color={Colors[theme].textLight} style={{ fontStyle: 'italic' }}>
                      Sending...
                    </Typography>
                  </View>
                )}
              </View>
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  onPress={() =>
                    handleInteraction({
                      type: "comment",
                      postId: postId,
                      commentId: comment?._id,
                    })
                  }
                  disabled={isDeleting}
                >
                  <Ionicons
                    name={isUserLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={isUserLiked ? "#ff0066" : Colors[theme].text}
                  />

                  <Typography weight="500" size={12} lineHeight={20}>
                    {comment?.likes?.length > 0 && comment.likes.length}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  onPress={handleReplyPress}
                  disabled={isDeleting}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={Colors[theme].text}
                  />
                  <Typography
                    weight="500"
                    size={12}
                    lineHeight={20}
                    color={Colors[theme].text}
                  >
                    Reply
                  </Typography>
                </TouchableOpacity>

                {/* View replies button */}
                {hasReplies && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                    onPress={handleViewReplies}
                    disabled={isDeleting}
                  >
                    <Typography
                      weight="500"
                      size={12}
                      lineHeight={20}
                      color={Colors.general.blue}
                    >
                      {comment?.replies?.length} {comment?.replies?.length === 1 ? 'reply' : 'replies'}
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      </View>


      {/* Comment Options Action Sheet */}
      <CommentOptions
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        options={generateOptions()}
        position={menuPosition}
      />
    </Animated.View>
  );
};

// Memoize CommentItem to prevent unnecessary re-renders
const MemoizedCommentItem = memo(CommentItem, (prevProps, nextProps) => {
  // Handle null comments
  if (!prevProps.comment || !nextProps.comment) {
    return prevProps.comment === nextProps.comment;
  }
  
  // Only re-render if essential props change
  return (
    prevProps.comment._id === nextProps.comment._id &&
    prevProps.comment.text === nextProps.comment.text &&
    prevProps.comment.likes?.length === nextProps.comment.likes?.length &&
    prevProps.comment.replies?.length === nextProps.comment.replies?.length &&
    prevProps.comment.isOptimistic === nextProps.comment.isOptimistic &&
    prevProps.isPersonalVideo === nextProps.isPersonalVideo &&
    prevProps.postId === nextProps.postId
  );
});

const styles = StyleSheet.create({
  commentContainer: {
    paddingVertical: 15,
    position: "relative",
    borderRadius: 2,
  },
  commentWrapper: {
    flexDirection: "row",
  },
  avatarColumn: {
    alignItems: "center",
  },
  contentColumn: {
    flex: 1,
    marginLeft: 12,
  },
  commentContent: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 5,
  },
  commentTextContainer: {
    marginBottom: 4,
  },
  optimisticIndicator: {
    marginTop: 4,
    opacity: 0.7,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 5,
    gap: 20,
  },
});

export default MemoizedCommentItem;
