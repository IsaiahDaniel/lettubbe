import React from "react";
import { View } from "react-native";
import CommunityInviteCard from "@/components/shared/chat/CommunityInviteCard";
import { TimestampDisplay } from "../TimestampDisplay";
import { TimestampService } from "../../services/TimestampService";
import { styles } from "../../styles/MessageStyles";
import { Colors } from "@/constants/Colors";
import InboxReplyPreview from "../InboxReplyPreview";

interface CommunityInviteMessageProps {
  message: any;
  isUser: boolean;
  formattedTime: string;
  theme: string;
  inviteData: any;
  replyMessage?: any;
  scrollToMessage?: (messageId: string) => void;
  highlightedMessageId?: string | null;
  isHighlighted?: boolean;
}

export const CommunityInviteMessage: React.FC<CommunityInviteMessageProps> = ({
  message,
  isUser,
  formattedTime,
  theme,
  inviteData,
  replyMessage,
  scrollToMessage,
  highlightedMessageId,
  isHighlighted
}) => {
  const inviteDataObj = inviteData || {};
  const shouldShowTimestamp = TimestampService.shouldShowTimestamp(message, [], 0);

  return (
    <View style={[
      styles.messageWrapper,
      isUser && styles.userMessageWrapper,
      { maxWidth: "85%" }
    ]}>
      <View
        style={[
          styles.messageBubble,
          { padding: 0, backgroundColor: "transparent" },
          isHighlighted && {
            backgroundColor: Colors.general.primary + '20',
          },
        ]}
      >
        {/* Reply Preview inside bubble for community invites */}
        {replyMessage && (
          <View style={{ padding: 8 }}>
            <InboxReplyPreview message={message} onPress={scrollToMessage} />
          </View>
        )}
        
        <CommunityInviteCard
          communityId={inviteDataObj?.communityId?.toString() || ''}
          communityName={inviteDataObj?.communityName?.toString() || ''}
          communityAvatar={inviteDataObj?.communityAvatar?.toString() || ''}
          memberCount={parseInt(inviteDataObj?.memberCount?.toString() || '0', 10) || 0}
          invitedBy={{
            username: inviteDataObj?.invitedBy?.username?.toString() || 'Unknown',
            firstName: inviteDataObj?.invitedBy?.firstName?.toString() || '',
            lastName: inviteDataObj?.invitedBy?.lastName?.toString() || ''
          }}
          description={inviteDataObj?.description?.toString() || ''}
          isWebLink={!!inviteDataObj?.isWebLink}
        />
      </View>
      <TimestampDisplay
        formattedTime={formattedTime}
        isUser={isUser}
        theme={theme}
        message={message}
        shouldShow={shouldShowTimestamp}
      />
    </View>
  );
};