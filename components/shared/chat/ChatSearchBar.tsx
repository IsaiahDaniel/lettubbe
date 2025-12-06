import React from 'react';
import SearchBar from '@/components/shared/chat/SearchBar';
import type { HeaderTab } from '@/constants/chat.constants';

interface ChatSearchBarProps {
  activeHeaderTab: HeaderTab;
  messagesSearchTerm: string;
  communitiesSearchTerm: string;
  onMessagesSearchChange: (term: string) => void;
  onCommunitiesSearchChange: (term: string) => void;
  onCallPress: () => void;
  onExplorePress: () => void;
  onCancel: (activeTab: string) => void;
}

const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  activeHeaderTab,
  messagesSearchTerm,
  communitiesSearchTerm,
  onMessagesSearchChange,
  onCommunitiesSearchChange,
  onCallPress,
  onExplorePress,
  onCancel,
}) => {
  if (activeHeaderTab === "Inbox") {
    return (
      <SearchBar 
        placeholder="Search conversations" 
        rightComponent="call" 
        onRightComponentPress={onCallPress}
        onSearchChange={onMessagesSearchChange}
        searchValue={messagesSearchTerm}
        showCancelButton={true}
        onCancel={() => onCancel(activeHeaderTab)}
      />
    );
  }

  return (
    <SearchBar 
      placeholder="Search communities" 
      rightComponent="explore" 
      onRightComponentPress={onExplorePress}
      onSearchChange={onCommunitiesSearchChange}
      searchValue={communitiesSearchTerm}
      showCancelButton={true}
      onCancel={() => onCancel(activeHeaderTab)}
    />
  );
};

export default ChatSearchBar;