import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';

interface Conversation {
  _id: string;
  sender: any;
  receiver: any;
  messages?: any[];
  updatedAt?: string;
}

interface Community {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  isJoined: boolean;
  description: string;
  lastMessage: null;
  lastMessageTime: null;
}

interface ConversationsListProps {
  conversations: Conversation[];
  communities: Community[];
  onConversationSelect: (conversation: Conversation) => void;
  onCommunitySelect: (community: Community) => void;
  getConversationDisplayName: (conversation: Conversation) => string;
  getConversationAvatar: (conversation: Conversation) => string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  communities,
  onConversationSelect,
  onCommunitySelect,
  getConversationDisplayName,
  getConversationAvatar,
}) => {
  const { theme } = useCustomTheme();

  // Combine conversations and communities for grid display
  const allRecentItems = [
    ...conversations.map((conversation) => ({
      id: conversation._id,
      type: 'conversation' as const,
      data: conversation,
      avatar: getConversationAvatar(conversation),
      name: getConversationDisplayName(conversation).split(' ')[0],
      onPress: () => onConversationSelect(conversation),
    })),
    ...communities.map((community) => ({
      id: community.id,
      type: 'community' as const,
      data: community,
      avatar: community.avatar || '',
      name: community.name.split(' ')[0],
      onPress: () => onCommunitySelect(community),
    })),
  ];

  const renderGridItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.gridItem} onPress={item.onPress}>
      <Avatar
        imageSource={{ uri: item.avatar }}
        size={70}
        uri
        showRing={item.type === 'conversation'}
        gapSize={2}
        showTextFallback={item.type === 'community'}
        alt={item.name}
      />
      <Typography size={11} style={styles.gridItemName} numberOfLines={1}>
        {item.name}
      </Typography>
    </TouchableOpacity>
  );

  if (allRecentItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography color="#888" style={styles.emptyText}>
          No recent conversations or communities
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Typography weight="600" size={14} textType="textBold" style={styles.title}>
        Recent
      </Typography>
      <View style={styles.gridContainer}>
        {/* Render items in rows of 4 */}
        {Array.from({ length: Math.ceil(allRecentItems.length / 4) }).map((_, rowIndex) => {
          const rowItems = allRecentItems.slice(rowIndex * 4, (rowIndex + 1) * 4);
          return (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {rowItems.map(renderGridItem)}
              {/* Fill remaining space if row has fewer than 4 items */}
              {Array.from({ length: 4 - rowItems.length }).map((_, emptyIndex) => (
                <View key={`empty-${rowIndex}-${emptyIndex}`} style={styles.gridItemWrapper} />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  gridContainer: {
    flexGrow: 0,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 16,
    // paddingHorizontal: 16,
  },
  gridItemWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemName: {
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
});

export default ConversationsList;