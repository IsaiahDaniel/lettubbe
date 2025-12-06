import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { formatTimePost } from "@/helpers/utils/util";
import usePostInteractions from "@/hooks/feeds/usePostInterations";
import useAuth from "@/hooks/auth/useAuth";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Avatar from "@/components/ui/Avatar";
import CommentOptions from "./CommentOptions";
import { useRouter } from "expo-router";
import { MentionText } from "@/components/ui/inputs/mentions";
import { parseMentionsFromBackend } from "@/helpers/utils/mentionUtils";

const ReplyItem = ({
  reply,
  parentUsername,
  postId,
  commentId,
  onAvatarPress,
  disableAvatarPress = false,
  setShowUserProfile,
}: any) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const router = useRouter();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isLongPressing, setIsLongPressing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!reply || Object.keys(reply).length === 0) return null;

  const { handleInteraction, isPending } = usePostInteractions(postId);
  const isUserLiked = reply?.likes?.includes(userDetails?._id);
  const isOwnReply = reply?.user?._id === userDetails?._id;
  const isCurrentUserReply = reply?.user?._id === userDetails?._id;
  // console.log("reply", JSON.stringify(reply, null, 2));

  const handleAvatarPress = () => {
    if (disableAvatarPress) {
      return;
    }

    // Priority: custom onAvatarPress handler takes precedence
    if (onAvatarPress) {
      onAvatarPress();
      return; // Early return to prevent other actions
    }

    // Handle current user's own reply
    if (isCurrentUserReply) {
      router.push("/(tabs)/profile");
      return; // Early return
    }

    // Handle other users' replies - show profile bottom sheet
    if (setShowUserProfile) {
      setShowUserProfile(true, reply?.user?._id);
    }
  };

  const handleLongPress = (event: {
    nativeEvent: { pageX: any; pageY: any };
  }) => {
    // Capture the position of the long press
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setOptionsVisible(true);
    setIsLongPressing(false);
    // Return t normal
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    setIsLongPressing(true);
    // Scale down
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isLongPressing) {
      setIsLongPressing(false);
      // Return to normal
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

  const generateOptions = () => {
    let options = [];

    if (isOwnReply) {
      // For user's own replies
      options = [
        {
          id: "share",
          icon: "share-social-outline",
          label: "Share",
          onPress: () => handleShare(reply._id),
        },
        {
          id: "delete",
          icon: "trash-outline",
          label: "Delete",
          onPress: () => handleDeleteReply(reply._id),
          color: Colors.general.error,
        },
      ];
    } else {
      // For other users' replies
      options = [
        {
          id: "share",
          icon: "share-social-outline",
          label: "Share",
          onPress: () => handleShare(reply._id),
        },
        {
          id: "report",
          icon: "flag-outline",
          label: "Report Reply",
          onPress: () => handleReportReply(reply._id),
        },
        {
          id: "block",
          icon: "ban-outline",
          label: "Block User",
          onPress: () => handleBlockUser(reply.user._id),
          color: Colors.general.error,
        },
      ];
    }

    return options;
  };

  // Placeholder functions for handling actions
  const handleShare = (replyId: string) => {
  };

  const handleDeleteReply = (replyId: string) => {
  };

  const handleReportReply = (replyId: string) => {
  };

  const handleBlockUser = (userId: string) => {
  };

  return (
    <Animated.View
      style={[
        styles.replyContainer,
        {
          transform: [{ scale: scaleAnim }],
          // backgroundColor: isLongPressing
          //   ? Colors[theme === 'dark' ? 'dark' : 'light'].cardBackground
          //   : 'transparent'
        },
      ]}
    >
      <Pressable
        style={{ flexDirection: "row", flex: 1 }}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
          <Avatar
            imageSource={
              reply?.user?.profilePicture ||
              reply?.profilePicture ||
              "https://i.stack.imgur.com/l60Hf.png"
            }
            uri={true}
            size={30}
            ringColor={Colors[theme].avatar}
            gapSize={2}
            showRing={false}
            expandable={false}
          />
        </TouchableOpacity>
        <View style={styles.replyContent}>
          <View>
            <View style={styles.replyHeader}>
              <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
                <Typography
                  weight="600"
                  size={12}
                  textType="textBold"
                  style={{ textTransform: "capitalize" }}
                >
                  {reply?.user?.username}
                </Typography>
              </TouchableOpacity>
              <Typography size={12} color="#BFBFBF">
                {formatTimePost(reply?.createdAt)}
              </Typography>
            </View>
            <Typography
              size={12}
              lineHeight={16}
              style={styles.replyingTo}
              color={Colors[theme].textLight}
            >
              {/* replying to{" "} */}
              <Typography color={Colors.general.blue} size={12}>
                @{parentUsername}
              </Typography>
            </Typography>
            <MentionText
              text={reply.text}
              mentions={parseMentionsFromBackend(reply.text, reply.mentions || []).mentions}
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
            {reply.isOptimistic && (
              <View style={styles.optimisticIndicator}>
                <Typography size={12} color={Colors[theme].textLight} style={{ fontStyle: 'italic' }}>
                  Sending...
                </Typography>
              </View>
            )}
          </View>
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.replyLikeButton}
              onPress={() =>
                handleInteraction({
                  type: "reply",
                  postId: postId,
                  commentId: commentId,
                  replyId: reply._id,
                })
              }
            >
              <Ionicons
                name={isUserLiked ? "heart" : "heart-outline"}
                size={20}
                color={isUserLiked ? "#ff0066" : Colors[theme].text}
              />
              {reply?.likes?.length > 0 && (
                <Typography style={styles.replyLikeCount}>
                  {reply?.likes?.length}
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>

      {/* Reply Options Action Sheet */}
      <CommentOptions
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        options={generateOptions()}
        position={menuPosition}
      />
    </Animated.View>
  );
};

export default ReplyItem;

const styles = StyleSheet.create({
  replyContainer: {
    flexDirection: "row",
    marginTop: 15,
    borderRadius: 8,
  },
  replyContent: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  replyingTo: {
    marginTop: 3,
  },
  replyText: {
    marginBottom: 5,
  },
  replyActions: {
    flexDirection: "row",
    marginTop: 2,
  },
  replyLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  replyLikeCount: {
    marginLeft: 5,
    fontSize: 13,
    color: "#888",
  },
  optimisticIndicator: {
    marginTop: 4,
  },
});
