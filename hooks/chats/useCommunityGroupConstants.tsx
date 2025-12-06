import React, { useState } from "react";
import DateSeparator from "@/components/shared/chat/DateSeparator";
import ChatMediaViewer from "@/components/shared/chat/ChatMediaViewer";
import { useMessageRendering } from "./useMessageRendering";
import { useMessageProcessing } from "./useMessageProcessing";
import { useCommunityHeader } from "./useCommunityHeader";
import { useCommunityEmptyState } from "./useCommunityEmptyState";
import { CommunityMessage, MessageListItem, MediaItem } from "@/helpers/types/chat/message.types";
import { isDateSeparator, isCommunityMessage } from "@/helpers/utils/messageUtils";

interface UseCommunityGroupConstantsProps {
  isUserMember: boolean;
  name: any;
  loadingUserJoinedCommunities: boolean;
  communityData: any;
  isJoining: boolean;
  handleInviteMembers: () => void;
  handleCommunityInfo: () => void;
  isSendingRequest?: boolean;
  hasPendingRequest?: boolean;
  messages?: CommunityMessage[];
  setReplyMessage?: (message: CommunityMessage | null) => void;
  replyMessage?: CommunityMessage | null;
  scrollToMessage?: (messageId: string) => void;
  onRetryUpload?: (messageId: string) => void;
  highlightedMessageId?: string | null;
}

const useCommunityGroupConstants = ({
  isUserMember,
  name,
  loadingUserJoinedCommunities,
  communityData,
  isJoining,
  handleInviteMembers,
  handleCommunityInfo,
  isSendingRequest = false,
  hasPendingRequest = false,
  messages = [],
  setReplyMessage,
  replyMessage,
  scrollToMessage,
  onRetryUpload,
  highlightedMessageId,
}: UseCommunityGroupConstantsProps) => {
  // Media viewer state
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [viewerMediaItems, setViewerMediaItems] = useState<MediaItem[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [viewerSenderName, setViewerSenderName] = useState<string>();
  const [viewerTimestamp, setViewerTimestamp] = useState<string>();

  // Function to open media viewer
  const openMediaViewer = (mediaItems: MediaItem[], initialIndex: number, senderName: string, timestamp: string) => {
    setViewerMediaItems(mediaItems);
    setViewerInitialIndex(initialIndex);
    setViewerSenderName(senderName);
    setViewerTimestamp(timestamp);
    setMediaViewerVisible(true);
  };

  // Use the custom hooks
  const { processMessagesWithDateSeparators } = useMessageProcessing();
  const { renderEmptyState } = useCommunityEmptyState({
    communityData,
    isUserMember,
    name,
  });
  const { renderListHeader } = useCommunityHeader({
    isUserMember,
    name,
    loadingUserJoinedCommunities,
    communityData,
    isJoining,
    handleInviteMembers,
    handleCommunityInfo,
    isSendingRequest,
    hasPendingRequest,
  });
  const { renderMessage } = useMessageRendering({
    messages,
    replyMessage,
    setReplyMessage,
    scrollToMessage,
    onMediaPress: openMediaViewer,
    onRetryUpload,
    highlightedMessageId,
  });

  // Create render item function that handles both messages and date separators
  const renderItem = ({ item, index }: { item: MessageListItem; index: number }) => {
    // Handle date separator items
    if (isDateSeparator(item)) {
      return <DateSeparator date={item.displayDate} />;
    }

    // Handle regular message items
    if (isCommunityMessage(item)) {
      return renderMessage({ item, index });
    }

    return null;
  };

  const renderMediaViewer = () => (
    <ChatMediaViewer
      visible={mediaViewerVisible}
      mediaItems={viewerMediaItems}
      initialIndex={viewerInitialIndex}
      onClose={() => setMediaViewerVisible(false)}
      senderName={viewerSenderName}
      timestamp={viewerTimestamp}
    />
  );

  return {
    renderEmptyState,
    renderListHeader,
    renderMessage,
    renderItem,
    processMessagesWithDateSeparators,
    renderMediaViewer,
  };
};

export default useCommunityGroupConstants;