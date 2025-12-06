import React from 'react';
import { View, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';

interface SearchResultsProps {
  search: any; // From useShareSearch hook
  onConversationSelect: (conversation: any) => void;
  onCommunitySelect: (community: any) => void;
  onBack: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  search,
  onConversationSelect,
  onCommunitySelect,
  onBack,
}) => {
  const { theme } = useCustomTheme();

  const handleUserSelect = (user: any) => {
    // Create a conversation-like object for the selected user
    const fakeConversation = {
      _id: `search_${user._id}`,
      sender: search.userDetails!,
      receiver: user,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    onConversationSelect(fakeConversation);
  };

  const handleSearchedCommunitySelect = (community: any) => {
    // Convert searched community to Community interface format
    const formattedCommunity = {
      id: community._id,
      name: community.name,
      avatar: community.photoUrl || '',
      memberCount: community.members?.length || 0,
      isJoined: true,
      description: community.description || '',
      lastMessage: null,
      lastMessageTime: null
    };
    onCommunitySelect(formattedCommunity);
  };

  const renderTabButtons = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => search.setSelectedTarget('chats')}
      >
        <Typography
          size={16}
          weight="600"
          color={search.selectedTarget === 'chats' ? Colors[theme].text : Colors[theme].textLight}
        >
          Chats
        </Typography>
        <View
          style={[
            styles.tabIndicator,
            search.selectedTarget === 'chats' && styles.activeTabIndicator
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => search.setSelectedTarget('communities')}
      >
        <Typography
          size={16}
          weight="600"
          color={search.selectedTarget === 'communities' ? Colors[theme].text : Colors[theme].textLight}
        >
          Communities
        </Typography>
        <View
          style={[
            styles.tabIndicator,
            search.selectedTarget === 'communities' && styles.activeTabIndicator
          ]}
        />
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleUserSelect(item)}
    >
      <Avatar
        imageSource={{ uri: item.profilePicture || '' }}
        size={48}
        uri
        showRing={true}
      />
      <View style={styles.itemInfo}>
        <Typography weight="500" textType="textBold">
          {`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          @{item.username}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => onConversationSelect(item)}
    >
      <Avatar
        imageSource={{ uri: search.getConversationAvatar(item) }}
        size={48}
        uri
        showRing={false}
      />
      <View style={styles.itemInfo}>
        <Typography weight="500" textType="textBold">
          {search.getConversationDisplayName(item)}
        </Typography>
        {item.messages && item.messages.length > 0 && item.updatedAt && (
          <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
            Last message: {new Date(item.updatedAt).toLocaleDateString()}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCommunityItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => item._id ? handleSearchedCommunitySelect(item) : onCommunitySelect(item)}
    >
      <Avatar
        imageSource={{ uri: item.photoUrl || item.avatar || '' }}
        size={48}
        uri
        showRing={false}
        showTextFallback={true}
        alt={item.name}
      />
      <View style={styles.itemInfo}>
        <Typography weight="500" textType="textBold">
          {item.name}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          {(item.members?.length || item.memberCount || 0)} member
          {(item.members?.length || item.memberCount || 0) !== 1 ? 's' : ''}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderLoadingState = (text: string) => (
    <View style={styles.centerContainer}>
      <Typography color={Colors[theme].textLight}>{text}</Typography>
    </View>
  );

  const renderEmptyState = (title: string, subtitle: string) => (
    <View style={styles.centerContainer}>
      <Typography color={Colors[theme].textLight}>{title}</Typography>
      <Typography color={Colors[theme].textLight} size={12} style={{ marginTop: 8 }}>
        {subtitle}
      </Typography>
    </View>
  );

  const renderContent = () => {
    if (search.selectedTarget === 'chats') {
      if (search.debouncedSearchQuery.trim()) {
        if (search.isSearchingUsers) {
          return renderLoadingState('Searching users...');
        }
        if (search.searchedUsers.length === 0) {
          return renderEmptyState('No users found', 'Try a different search term');
        }
        return (
          <FlatList
            data={search.searchedUsers}
            renderItem={renderUserItem}
            keyExtractor={(item, index) => item?._id || `user-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        );
      } else {
        if (search.isPending) {
          return renderLoadingState('Loading conversations...');
        }
        if (!search.conversationsList || search.conversationsList.length === 0) {
          return renderEmptyState('No conversations found', 'Start a chat with someone to share content');
        }
        return (
          <FlatList
            data={search.filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item, index) => item._id || `conversation-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        );
      }
    } else {
      if (search.debouncedSearchQuery.trim()) {
        if (search.isSearchingCommunities) {
          return renderLoadingState('Searching communities...');
        }
        if (search.searchedCommunities.length === 0) {
          return renderEmptyState('No communities found', 'Try a different search term');
        }
        return (
          <FlatList
            data={search.searchedCommunities}
            renderItem={renderCommunityItem}
            keyExtractor={(item, index) => item?._id || `search-community-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        );
      } else {
        if (search.isLoadingCommunities) {
          return renderLoadingState('Loading communities...');
        }
        if (!search.communitiesList || search.communitiesList.length === 0) {
          return renderEmptyState('No communities found', 'Join a community to share content');
        }
        return (
          <FlatList
            data={search.filteredCommunities}
            renderItem={renderCommunityItem}
            keyExtractor={(item, index) => item.id || `community-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, {
            backgroundColor: Colors[theme].inputBackground,
            borderColor: Colors[theme].borderColor,
          }]}>
            <Ionicons name="search" size={20} color={Colors[theme].textLight} />
            <TextInput
              style={[styles.searchInput, { color: Colors[theme].textBold }]}
              placeholder="Search conversations..."
              placeholderTextColor={Colors[theme].textLight}
              value={search.searchQuery}
              onChangeText={search.setSearchQuery}
              autoFocus
            />
          </View>
          <TouchableOpacity onPress={onBack} style={styles.cancelButton}>
            <Typography color={Colors.general.primary} weight="500">
              Cancel
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {renderTabButtons()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tab: {
    marginRight: 24,
    paddingVertical: 12,
    width: 120,
    alignItems: 'center'
  },
  tabIndicator: {
    width: 120,
    height: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  activeTabIndicator: {
    backgroundColor: Colors.general.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SearchResults;