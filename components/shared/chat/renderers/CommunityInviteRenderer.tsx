import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { MessageRenderProps } from "@/helpers/types/chat/message.types";
import { extractUsername, extractVideoDataFromMessage, extractCommunityInviteDataFromMessage } from "@/helpers/utils/messageUtils";
import MessageAvatar from "../MessageAvatar";
import MessageTimestamp from "./MessageTimestamp";
import SharedVideoCard from "../SharedVideoCard";
import SharedPhotoCard from "../SharedPhotoCard";
import CommunityInviteCard from "../CommunityInviteCard";

const CommunityInviteRenderer: React.FC<MessageRenderProps> = ({
  item,
  isOwnMessage,
  formattedTime,
  shouldShowTimestamp,
  onUserPress,
}) => {
  const { theme } = useCustomTheme();
  const username = extractUsername(item.userId);
  const userId = item.userId;
  
  const videoData = extractVideoDataFromMessage(item.text);
  const inviteData = extractCommunityInviteDataFromMessage(item.text);

  const renderContent = () => {
    if (inviteData) {
      return (
        <CommunityInviteCard
          communityId={inviteData.communityId}
          communityName={inviteData.communityName}
          communityAvatar={inviteData.communityAvatar}
          memberCount={inviteData.memberCount}
          invitedBy={inviteData.invitedBy}
          description={inviteData.description}
          isWebLink={inviteData.isWebLink}
        />
      );
    }

    if (videoData) {
      return videoData.images && videoData.images.length > 0 ? (
        <SharedPhotoCard
          photoData={videoData}
          messageSender={userId}
        />
      ) : (
        <SharedVideoCard
          videoData={videoData}
          messageSender={userId}
        />
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isOwnMessage && userId && (
        <MessageAvatar
          user={userId}
          onPress={() => onUserPress && onUserPress(typeof userId === "object" ? userId._id : userId)}
          disabled={!userId}
        />
      )}

      <View style={[styles.messageWrapper, { maxWidth: "85%" }]}>
        {!isOwnMessage && userId && (
          <TouchableOpacity
            onPress={() => onUserPress && onUserPress(typeof userId === "object" ? userId._id : userId)}
            activeOpacity={0.7}
            disabled={!userId}
          >
            <Typography
              weight="500"
              size={12}
              color={Colors.general.primary}
              style={styles.senderName}
            >
              {username}
            </Typography>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.messageBubble,
            { padding: 0, backgroundColor: "transparent" },
          ]}
        >
          {renderContent()}
        </View>

        <MessageTimestamp
          show={shouldShowTimestamp}
          time={formattedTime}
          isOwnMessage={isOwnMessage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 15,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageWrapper: {
    maxWidth: "75%",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  senderName: {
    marginBottom: 2,
    marginHorizontal: 4,
  },
});

export default CommunityInviteRenderer;