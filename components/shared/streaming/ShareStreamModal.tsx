import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import CustomBottomSheet from '@/components/shared/videoUpload/CustomBottomSheet';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';
import useAuth from '@/hooks/auth/useAuth';
import { useStreamSharing } from '@/hooks/streaming/useStreamSharing';
import { useShareSearch } from '@/hooks/streaming/useShareSearch';
import ShareOptions from './ShareOptions';
import StreamPreview from './StreamPreview';
import ConversationsList from './ConversationsList';
import SearchResults from './SearchResults';
import LinkSection from './LinkSection';

interface ShareStreamModalProps {
  isVisible: boolean;
  onClose: () => void;
  streamData: UpcomingStream;
}

type ViewMode = 'main' | 'search' | 'preview';

const ShareStreamModal: React.FC<ShareStreamModalProps> = ({
  isVisible,
  onClose,
  streamData,
}) => {
  const { userDetails, token } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [selectedTarget, setSelectedTarget] = useState<any>(null);

  // Custom hooks handle all the logic
  const sharing = useStreamSharing(streamData, userDetails, token);
  const search = useShareSearch(userDetails);

  const handleConversationSelect = (conversation: any) => {
    setSelectedTarget({ type: 'conversation', data: conversation });
    setViewMode('preview');
  };

  const handleCommunitySelect = (community: any) => {
    setSelectedTarget({ type: 'community', data: community });
    setViewMode('preview');
  };

  const handleSend = () => {
    if (selectedTarget?.type === 'conversation') {
      const otherParticipant = selectedTarget.data.sender._id === userDetails?._id
        ? selectedTarget.data.receiver
        : selectedTarget.data.sender;
      sharing.sendToChat(otherParticipant._id);
    } else if (selectedTarget?.type === 'community') {
      sharing.sendToCommunity(selectedTarget.data.id);
    }
    onClose();
  };

  const getTargetName = () => {
    if (selectedTarget?.type === 'conversation') {
      return search.getConversationDisplayName(selectedTarget.data);
    }
    return selectedTarget?.data?.name || '';
  };

  const renderMainView = () => (
    <View style={{ flex: 1, paddingTop: 16 }}>
      <FlatList
        data={[
          { type: 'conversations' },
          { type: 'share' },
          { type: 'link' }
        ]}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'conversations':
              return (
                <ConversationsList
                  conversations={search.conversationsList.slice(0, 8)}
                  communities={search.communitiesList.slice(0, 4)}
                  onConversationSelect={handleConversationSelect}
                  onCommunitySelect={handleCommunitySelect}
                  getConversationDisplayName={search.getConversationDisplayName}
                  getConversationAvatar={search.getConversationAvatar}
                />
              );
            case 'share':
              return (
                <ShareOptions
                  onChatPress={() => setViewMode('search')}
                  onWhatsAppPress={sharing.shareToWhatsApp}
                  onTwitterPress={sharing.shareToTwitter}
                  onTelegramPress={sharing.shareToTelegram}
                  onMorePress={sharing.shareToSystem}
                />
              );
            case 'link':
              return (
                <LinkSection
                  shareLink={sharing.shareLink}
                  onCopy={sharing.copyToClipboard}
                />
              );
            default:
              return null;
          }
        }}
        keyExtractor={(item) => item.type}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderSearchView = () => (
    <SearchResults
      search={search}
      onConversationSelect={handleConversationSelect}
      onCommunitySelect={handleCommunitySelect}
      onBack={() => setViewMode('main')}
    />
  );

  const renderPreviewView = () => (
    <StreamPreview
      streamData={streamData}
      targetName={getTargetName()}
      caption={sharing.caption}
      onCaptionChange={sharing.setCaption}
      onSend={handleSend}
      onBack={() => setViewMode('main')}
    />
  );

  const getSheetHeight = () => {
    switch (viewMode) {
      case 'preview': return 600;
      case 'search': return 500;
      default: return 500;
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'search': return renderSearchView();
      case 'preview': return renderPreviewView();
      default: return renderMainView();
    }
  };

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      showCloseIcon={false}
      sheetheight={getSheetHeight()}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

export default ShareStreamModal;