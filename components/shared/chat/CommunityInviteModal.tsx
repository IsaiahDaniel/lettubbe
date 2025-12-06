import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Share, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import CustomBottomSheet from '@/components/shared/videoUpload/CustomBottomSheet';
import useGetUserConversationsInfinite from '@/hooks/chats/useGetUserConversationsInfinite';
import useAuth from '@/hooks/auth/useAuth';
import { getSocket } from '@/helpers/utils/socket';
import showToast from '@/helpers/utils/showToast';
import { useDebounce } from '@/hooks/explore/useDebounce';
import useSearchUsers from '@/hooks/useSearchUsers';

interface CommunityInviteModalProps {
  isVisible: boolean;
  onClose: () => void;
  communityData: {
    _id: string;
    name: string;
    description?: string;
    photoUrl?: string;
    memberCount: number;
  };
}

interface Conversation {
  _id: string;
  sender: {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  receiver: {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  messages?: any[];
  updatedAt?: string;
}

const CommunityInviteModal: React.FC<CommunityInviteModalProps> = ({
  isVisible,
  onClose,
  communityData,
}) => {
  const { theme } = useCustomTheme();
  const { userDetails, token } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get conversations
  const { data: conversations, isPending } = useGetUserConversationsInfinite();
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Search users hook
  const { users: searchedUsers, isLoading: isSearchingUsers } = useSearchUsers(debouncedSearchQuery);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isVisible) {
      // Reset all state when modal closes
      setSelectedConversation(null);
      setMessage('');
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  }, [isVisible]);

  // Extract the actual conversations array
  const conversationsList: Conversation[] = (conversations || []).filter((item: any): item is Conversation => 
    item && typeof item === 'object' && item._id && item.sender && item.receiver
  );

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationsList;
    
    return conversationsList.filter((conversation: Conversation) => {
      const otherParticipant = conversation.sender._id === userDetails?._id
        ? conversation.receiver
        : conversation.sender;
      
      if (!otherParticipant) return false;
      
      const displayName = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim();
      const username = otherParticipant.username || '';
      
      return (
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversationsList, searchQuery, userDetails?._id]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessage('');
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const handleSearchCancel = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  const handleUserSelect = (user: any) => {
    // Create a conversation-like object for the selected user
    const fakeConversation: Conversation = {
      _id: `search_${user._id}`,
      sender: userDetails!,
      receiver: user,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSelectedConversation(fakeConversation);
  };

  const handleSendInvite = () => {
    if (selectedConversation) {
      const socket = getSocket(token);
      if (socket && userDetails && selectedConversation.sender && selectedConversation.receiver) {
        const otherParticipant = selectedConversation.sender._id === userDetails?._id
          ? selectedConversation.receiver
          : selectedConversation.sender;

        // Create community invite link with embedded data
        const inviteLink = `https://lettubbe.com/community/${communityData._id}?invite=true`;

        const inviteMessage = {
          sender: userDetails._id,
          receiver: otherParticipant._id,
          text: inviteLink,
          userId: userDetails._id,
          messageType: 'community_invite',
        };

        socket.emit('chat', inviteMessage);

        // If there's a custom message, send it as a separate message
        if (message.trim()) {
          setTimeout(() => {
            const textMessage = {
              sender: userDetails._id,
              receiver: otherParticipant._id,
              text: message.trim(),
              userId: userDetails._id,
            };

            socket.emit('chat', textMessage);
          }, 300);
        }

        // Show success toast
        showToast('success', 'Invite sent');
      }
    }

    onClose();
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (!conversation || !conversation.sender || !conversation.receiver) return 'Unknown User';
    
    // Get the other participant (not the current user)
    const otherParticipant = conversation.sender._id === userDetails?._id
      ? conversation.receiver
      : conversation.sender;
    
    if (!otherParticipant) return 'Unknown User';
    
    return `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (!conversation || !conversation.sender || !conversation.receiver) return '';
    
    const otherParticipant = conversation.sender._id === userDetails?._id
      ? conversation.receiver
      : conversation.sender;
    
    return otherParticipant?.profilePicture || '';
  };

  // External sharing handlers
  const inviteLink = `https://lettubbe.com/community/${communityData._id}?invite=true`;
  const shareText = ``;
  // const shareText = `Join ${communityData.name} community on Lettubbe`;

  const handleWhatsAppShare = async () => {
    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`${shareText}${inviteLink}`)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        showToast('error', 'WhatsApp is not installed');
      }
    } catch (error) {
      showToast('error', 'Failed to share to WhatsApp');
    }
  };

  const handleTwitterShare = async () => {
    try {
      const twitterUrl = `twitter://post?message=${encodeURIComponent(`${shareText}${inviteLink}`)}`;
      const webTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}${inviteLink}`)}`;
      
      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        await Linking.openURL(webTwitterUrl);
      }
    } catch (error) {
      showToast('error', 'Failed to share to X');
    }
  };

  const handleTelegramShare = async () => {
    try {
      const telegramUrl = `tg://msg?text=${encodeURIComponent(`${shareText}${inviteLink}`)}`;
      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        showToast('error', 'Telegram is not installed');
      }
    } catch (error) {
      showToast('error', 'Failed to share to Telegram');
    }
  };

  const handleMoreShare = async () => {
    try {
      await Share.share({
        message: `${shareText}${inviteLink}`,
        title: `Join ${communityData.name} on Lettubbe`,
      });
    } catch (error) {
      showToast('error', 'Failed to share');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(inviteLink);
      showToast('success', 'Invite link copied to clipboard!');
    } catch (error) {
      showToast('error', 'Failed to copy link');
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationSelect(item)}
    >
      <Avatar
        imageSource={{ uri: getConversationAvatar(item) }}
        size={48}
        uri
        showRing={false}
      />
      <View style={styles.conversationInfo}>
        <Typography weight="500" textType="textBold">
          {getConversationDisplayName(item)}
        </Typography>
        {item.messages && item.messages.length > 0 && item.updatedAt && (
          <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
            Last message: {new Date(item.updatedAt).toLocaleDateString()}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSearchUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleUserSelect(item)}
    >
      <Avatar
        imageSource={{ uri: item.profilePicture || '' }}
        size={48}
        uri
        showRing={true}
      />
      <View style={styles.conversationInfo}>
        <Typography weight="500" textType="textBold">
          {`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          @{item.username}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderRecentConversations = () => {
    const recentConversations = conversationsList.slice(0, 8); // Show up to 8 recent conversations
    
    const renderGridItem = ({ item }: { item: Conversation }) => (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleConversationSelect(item)}
      >
        <Avatar
          imageSource={{ uri: getConversationAvatar(item) }}
          size={70}
          uri
          showRing={true}
          gapSize={2}
        />
        <Typography size={11} style={styles.gridItemName} numberOfLines={1}>
          {getConversationDisplayName(item).split(' ')[0]}
        </Typography>
      </TouchableOpacity>
    );
    
    return (
      <View style={styles.recentContainer}>
        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <View style={styles.recentSection}>
            <Typography weight="600" size={14} textType="textBold" style={styles.sectionTitle}>
              Recent
            </Typography>
            <View style={styles.gridContainer}>
              {recentConversations.map((item, index) => {
                if (index % 4 === 0) {
                  const rowItems = recentConversations.slice(index, index + 4);
                  return (
                    <View key={`row-${index}`} style={styles.gridRow}>
                      {rowItems.map((rowItem) => (
                        <View key={rowItem._id} style={styles.gridItemWrapper}>
                          {renderGridItem({ item: rowItem })}
                        </View>
                      ))}
                      {/* Fill remaining space if row has fewer than 4 items */}
                      {Array.from({ length: 4 - rowItems.length }).map((_, emptyIndex) => (
                        <View key={`empty-${index}-${emptyIndex}`} style={styles.gridItemWrapper} />
                      ))}
                    </View>
                  );
                } else if (index % 4 !== 0) {
                  return null;
                }
                return null;
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderShareOptions = () => {
    const shareOptions = [
      { id: 'chat', name: 'Chat', icon: 'chatbubble-outline', onPress: handleSearchToggle },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', onPress: handleWhatsAppShare },
      { id: 'twitter', name: 'X', icon: 'logo-twitter', onPress: handleTwitterShare },
      { id: 'telegram', name: 'Telegram', icon: 'paper-plane-outline', onPress: handleTelegramShare },
      { id: 'more', name: 'More', icon: 'share-outline', onPress: handleMoreShare },
    ];

    return (
      <View style={styles.shareSection}>
        <Typography weight="600" size={14} textType="textBold" style={styles.sectionTitle}>
          Share with
        </Typography>
        <View style={styles.shareOptionsContainer}>
          {shareOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.shareOption}
              onPress={option.onPress}
            >
              <View style={[styles.shareOptionIcon, { backgroundColor: Colors[theme].inputBackground }]}>
                <Ionicons name={option.icon as any} size={24} color={Colors[theme].textBold} />
              </View>
              <Typography size={11} style={styles.shareOptionText} numberOfLines={1}>
                {option.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLinkSection = () => {
    return (
      <View style={styles.linkSection}>
        <Typography weight="600" size={14} textType="textBold" style={styles.sectionTitle}>
          Or share with link
        </Typography>
        <View style={[styles.linkContainer, {
          backgroundColor: Colors[theme].inputBackground,
          borderColor: Colors[theme].borderColor,
        }]}>
          <Typography 
            size={12} 
            color={Colors[theme].textLight} 
            style={styles.linkText}
            numberOfLines={1}
          >
            {inviteLink}
          </Typography>
          <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color={Colors[theme].textBold} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchResults = () => (
    <View style={styles.container}>
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
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <TouchableOpacity onPress={handleSearchCancel} style={styles.cancelButton}>
            <Typography color={Colors.general.primary} weight="500">
              Cancel
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {debouncedSearchQuery.trim() ? (
        isSearchingUsers ? (
          <View style={styles.loadingContainer}>
            <Typography color={Colors[theme].textLight}>Searching users...</Typography>
          </View>
        ) : searchedUsers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Typography color={Colors[theme].textLight}>No users found</Typography>
            <Typography color={Colors[theme].textLight} size={12} style={{ marginTop: 8 }}>
              Try a different search term
            </Typography>
          </View>
        ) : (
          <FlatList
            data={searchedUsers}
            renderItem={renderSearchUserItem}
            keyExtractor={(item, index) => item?._id || `user-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.conversationsList}
          />
        )
      ) : (
        isPending ? (
          <View style={styles.loadingContainer}>
            <Typography color={Colors[theme].textLight}>Loading conversations...</Typography>
          </View>
        ) : !conversationsList || conversationsList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Typography color={Colors[theme].textLight}>No conversations found</Typography>
            <Typography color={Colors[theme].textLight} size={12} style={{ marginTop: 8 }}>
              Start a chat with someone to share content
            </Typography>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item, index) => item._id || `conversation-${index}`}
            showsVerticalScrollIndicator={false}
            style={styles.conversationsList}
          />
        )
      )}
    </View>
  );

  const renderConversationsList = () => {
    // sections for FlatList
    const sections = [
      { type: 'recent', data: null },
      { type: 'share', data: null },
      { type: 'link', data: null }
    ];

    const renderSection = ({ item }: { item: any }) => {
      switch (item.type) {
        case 'recent':
          return renderRecentConversations();
        case 'share':
          return renderShareOptions();
        case 'link':
          return renderLinkSection();
        default:
          return null;
      }
    };

    return (
      <View style={styles.container}>
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.type}
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        />
      </View>
    );
  };

  const renderCommunityPreview = () => {
    const targetName = selectedConversation ? getConversationDisplayName(selectedConversation) : '';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].textBold} />
          </TouchableOpacity>
          <Typography weight="600" size={18} textType="textBold">
            Send to {targetName}
          </Typography>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.communityPreviewContainer}>
          {/* Community Card Preview */}
          <View style={styles.communityCard}>
            <View style={styles.communityCardHeader}>
              <Typography weight="600" size={16} textType="textBold" style={styles.previewHeaderTitle}>
                Inviting to:
              </Typography>
            </View>

            <View style={[styles.communityInfo, {backgroundColor: Colors[theme].cardBackground}]}>
              {communityData.photoUrl ? (
                <Avatar
                  imageSource={{ uri: communityData.photoUrl }}
                  size={60}
                  uri
                  showRing={false}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[theme].secondary + '20' }]}>
                  <Typography size={24} weight="600" color={Colors[theme].textLight}>
                    {communityData.name.charAt(0).toUpperCase()}
                  </Typography>
                </View>
              )}
              
              <View style={styles.communityTextInfo}>
                <Typography size={16} weight="600" color={Colors[theme].textBold} numberOfLines={1}>
                  {communityData.name}
                </Typography>
                <Typography size={14} color={Colors[theme].textLight}>
                  {communityData.memberCount} member{communityData.memberCount !== 1 ? 's' : ''}
                </Typography>
                {communityData.description && (
                  <Typography size={12} color={Colors[theme].textLight} numberOfLines={2} style={{ marginTop: 4 }}>
                    {communityData.description}
                  </Typography>
                )}
              </View>
            </View>
          </View>

          {/* Message Input with Send Icon */}
          <View style={styles.messageContainer}>
            <TextInput
              style={[styles.messageInput, {
                backgroundColor: Colors[theme].inputBackground,
                color: Colors[theme].textBold,
                borderColor: Colors[theme].borderColor,
              }]}
              placeholder="Add a message (optional)..."
              placeholderTextColor={Colors[theme].textLight}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendIcon, { backgroundColor: Colors.general.primary }]}
              onPress={handleSendInvite}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      showCloseIcon={false}
      sheetheight={selectedConversation ? 600 : 500}
    >
      {selectedConversation ? renderCommunityPreview() : isSearchExpanded ? renderSearchResults() : renderConversationsList()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  backButton: {
    // paddingLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // borderWidth: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  recentContainer: {
    marginBottom: 24,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexGrow: 0,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  gridItemWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  gridItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemName: {
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  shareSection: {
    marginBottom: 24,
  },
  shareOptionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 0,
    justifyContent: 'space-evenly',
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionText: {
    marginTop: 8,
    textAlign: 'center',
  },
  linkSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
  },
  linkText: {
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityPreviewContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  communityCard: {
    marginBottom: 16,
  },
  communityCardHeader: {
    marginBottom: 12,
  },
  previewHeaderTitle: {
    marginBottom: 8,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

export default CommunityInviteModal;