import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView, Dimensions, Share, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import CustomBottomSheet from '@/components/shared/videoUpload/CustomBottomSheet';
import useGetUserConversationsInfinite from '@/hooks/chats/useGetUserConversationsInfinite';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/auth/useAuth';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';
import { getSocket } from '@/helpers/utils/socket';
import { formatVideoDuration } from '@/helpers/utils/formatting';
import showToast from '@/helpers/utils/showToast';
import { useDebounce } from '@/hooks/explore/useDebounce';
import useSearchUsers from '@/hooks/useSearchUsers';
import useSearchCommunities from '@/hooks/useSearchCommunities';

interface ShareVideoModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoData: {
    _id: string;
    thumbnail?: string;
    images?: string[]; // For photo posts
    duration?: string;
    description: string;
    user: {
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
    };
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

import { Community } from '@/helpers/types/chat/chat.types';
import * as Clipboard from 'expo-clipboard';

interface ApiCommunity {
  _id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  members?: any[];
  type: 'public' | 'private' | 'hidden';
}

type ShareTarget = 'chats' | 'communities';
type SelectionType = Conversation | Community;

const ShareVideoModal: React.FC<ShareVideoModalProps> = ({
  isVisible,
  onClose,
  videoData,
}) => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { userDetails, token } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const [selectedTarget, setSelectedTarget] = useState<ShareTarget>('chats');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [caption, setCaption] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { data: conversations, isPending } = useGetUserConversationsInfinite();
  const { data: communitiesResponse, isPending: isLoadingCommunities } = useGetJoinedCommunities();
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Search users hook
  const { users: searchedUsers, isLoading: isSearchingUsers } = useSearchUsers(debouncedSearchQuery);
  
  // Search communities hook
  const { communities: searchedCommunities, isLoading: isSearchingCommunities } = useSearchCommunities(debouncedSearchQuery);

  // Extract the actual conversations array
  const conversationsList: Conversation[] = (conversations || []).filter((item: any): item is Conversation => 
    item && typeof item === 'object' && item._id && item.sender && item.receiver
  );

  // Flatten infinite query data and transform to match Community interface
  const allJoinedCommunitiesData = useMemo(() => 
    communitiesResponse?.pages?.flatMap((page: any) => page?.data?.data || []) || [],
    [communitiesResponse?.pages]
  );

  const communitiesList: Community[] = (allJoinedCommunitiesData || []).map((apiCommunity: ApiCommunity) => ({
    id: apiCommunity._id,
    name: apiCommunity.name,
    avatar: apiCommunity.photoUrl || '',
    memberCount: apiCommunity.members?.length || 0,
    isJoined: true,
    description: apiCommunity.description || '',
    lastMessage: null,
    lastMessageTime: null
  }));

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationsList;
    
    return conversationsList.filter((conversation: Conversation) => {
      const otherParticipant = conversation.sender._id === userDetails?._id
        ? conversation.receiver
        : conversation.sender;
      
      if (!otherParticipant) return false;
      
      const displayName = `${(otherParticipant as any)?.firstName || ''} ${(otherParticipant as any)?.lastName || ''}`.trim();
      const username = (otherParticipant as any)?.username || '';
      
      return (
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversationsList, searchQuery, userDetails?._id]);

  // Filter communities based on search query
  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return communitiesList;
    
    return communitiesList.filter((community: Community) => {
      return (
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.description && community.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [communitiesList, searchQuery]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedCommunity(null);
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    setSelectedConversation(null);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setSelectedCommunity(null);
    setCaption('');
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
    setSelectedCommunity(null);
  };

  const handleSearchedCommunitySelect = (community: any) => {
    // Convert searched community to Community interface format
    const formattedCommunity: Community = {
      id: community._id,
      name: community.name,
      avatar: community.photoUrl || '',
      memberCount: community.members?.length || 0,
      isJoined: true,
      description: community.description || '',
      lastMessage: null,
      lastMessageTime: null
    };
    setSelectedCommunity(formattedCommunity);
    setSelectedConversation(null);
  };

  const handleSendVideo = () => {
    if (selectedConversation) {
      // Handle chat sharing - send via socket instead of navigating
      const socket = getSocket(token || '');
      if (socket && userDetails) {
        const otherParticipant = selectedConversation.sender._id === userDetails?._id
          ? selectedConversation.receiver
          : selectedConversation.sender;

        // Create clean media link (same format for photos and videos)
        const isPhotoPost = videoData.images && videoData.images.length > 0;
        const mediaLink = `lettubbe://${isPhotoPost ? 'photo' : 'video'}/${videoData._id}`;

        const mediaMessage = {
          sender: userDetails._id,
          receiver: otherParticipant._id,
          text: mediaLink,
          userId: userDetails._id,
        };

        socket.emit('chat', mediaMessage);

        // If there's a caption, send it as a separate message
        if (caption.trim()) {
          setTimeout(() => {
            const captionMessage = {
              sender: userDetails._id,
              receiver: otherParticipant._id,
              text: caption.trim(),
              userId: userDetails._id,
            };

            socket.emit('chat', captionMessage);
          }, 300);
        }

        // Show success toast
        showToast('success', 'Sent');
      }
    } else if (selectedCommunity) {
      // Handle community sharing
      const socket = getSocket(token || '');
      if (socket && userDetails) {
        // Create clean media link
        const isPhotoPost = videoData.images && videoData.images.length > 0;
        const mediaLink = `lettubbe://${isPhotoPost ? 'photo' : 'video'}/${videoData._id}`;

        const mediaMessage = {
          sender: userDetails._id,
          groupId: selectedCommunity.id,
          text: mediaLink,
          userId: userDetails._id,
        };

        socket.emit('GroupChat', mediaMessage);

        // If there's a caption, send it as a separate message
        if (caption.trim()) {
          setTimeout(() => {
            const captionMessage = {
              sender: userDetails._id,
              groupId: selectedCommunity.id,
              text: caption.trim(),
              userId: userDetails._id,
            };

            socket.emit('GroupChat', captionMessage);
          }, 300);
        }

        // Show success toast
        showToast('success', 'Sent');
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
    
    return `${(otherParticipant as any)?.firstName || ''} ${(otherParticipant as any)?.lastName || ''}`.trim() || (otherParticipant as any)?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (!conversation || !conversation.sender || !conversation.receiver) return '';
    
    const otherParticipant = conversation.sender._id === userDetails?._id
      ? conversation.receiver
      : conversation.sender;
    
    return (otherParticipant as any)?.profilePicture || '';
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

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleCommunitySelect(item)}
    >
      <Avatar
        imageSource={{ uri: item.avatar || '' }}
        size={48}
        uri
        showRing={false}
        showTextFallback={true}
        alt={item.name}
      />
      <View style={styles.conversationInfo}>
        <Typography weight="500" textType="textBold">
          {item.name}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderSearchUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleUserSelect(item)}
    >
      <Avatar
        imageSource={{ uri: (item as any)?.profilePicture || '' }}
        size={48}
        uri
        showRing={true}
      />
      <View style={styles.conversationInfo}>
        <Typography weight="500" textType="textBold">
          {`${(item as any)?.firstName || ''} ${(item as any)?.lastName || ''}`.trim() || (item as any)?.username}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          @{item.username}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderSearchCommunityItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleSearchedCommunitySelect(item)}
    >
      <Avatar
        imageSource={{ uri: item.photoUrl || '' }}
        size={48}
        uri
        showRing={false}
        showTextFallback={true}
        alt={item.name}
      />
      <View style={styles.conversationInfo}>
        <Typography weight="500" textType="textBold">
          {item.name}
        </Typography>
        <Typography size={12} color={Colors[theme].textLight} numberOfLines={1}>
          {item.members?.length || 0} member{(item.members?.length || 0) !== 1 ? 's' : ''}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderTabButtons = () => (
    <View style={styles.headerTabsContainer}>
      <TouchableOpacity
        style={styles.headerTab}
        onPress={() => setSelectedTarget('chats')}
      >
        <View style={styles.headerTabTextContainer}>
          <Typography
            size={16}
            weight="600"
            textType={selectedTarget === 'chats' ? "textBold" : undefined}
            color={selectedTarget === 'chats' ? Colors[theme].text : Colors[theme].textLight}
          >
            Chats
          </Typography>
        </View>
        <View
          style={[
            styles.headerTabIndicator,
            selectedTarget === 'chats' && styles.activeHeaderTabIndicator
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.headerTab}
        onPress={() => setSelectedTarget('communities')}
      >
        <View style={styles.headerTabTextContainer}>
          <Typography
            size={16}
            weight="600"
            color={selectedTarget === 'communities' ? Colors[theme].text : Colors[theme].textLight}
          >
            Communities
          </Typography>
        </View>
        <View
          style={[
            styles.headerTabIndicator,
            selectedTarget === 'communities' && styles.activeHeaderTabIndicator
          ]}
        />
      </TouchableOpacity>
    </View>
  );

  const renderRecentConversations = () => {
    const recentConversations = conversationsList.slice(0, 8); // Show up to 8 recent conversations
    const recentCommunities = communitiesList.slice(0, 4); // Show up to 4 recent communities
    
    // Combine conversations and communities into a single array for grid display
    const allRecentItems = [
      ...recentConversations.map((conversation: Conversation) => ({
        id: conversation._id,
        type: 'conversation' as const,
        data: conversation,
        avatar: getConversationAvatar(conversation),
        name: getConversationDisplayName(conversation).split(' ')[0],
        onPress: () => handleConversationSelect(conversation),
      })),
      ...recentCommunities.map((community: Community) => ({
        id: community.id,
        type: 'community' as const,
        data: community,
        avatar: community.avatar || '',
        name: community.name.split(' ')[0],
        onPress: () => handleCommunitySelect(community),
      })),
    ];

    const renderGridItem = ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={item.onPress}
      >
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
    
    return (
      <View style={styles.recentContainer}>
        {/* Recent Conversations and Communities */}
        {allRecentItems.length > 0 && (
          <View style={styles.recentSection}>
            <Typography weight="600" size={14} textType="textBold" style={styles.sectionTitle}>
              Recent
            </Typography>
            <View style={styles.gridContainer}>
              {allRecentItems.map((item, index) => {
                if (index % 4 === 0) {
                  const rowItems = allRecentItems.slice(index, index + 4);
                  return (
                    <View key={`row-${index}`} style={styles.gridRow}>
                      {rowItems.map((rowItem) => (
                        <View key={rowItem.id} style={styles.gridItemWrapper}>
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
    // Use production domain for sharing
    const isPhotoPost = videoData.images && videoData.images.length > 0;
    const webShareLink = `https://lettubbe.com/${isPhotoPost ? 'photo' : 'video'}/${videoData._id}`;
    // const shareText = `Check out this post by ${videoData.user?.username || 'someone'}`;
    const shareText = ``;
    
    const handleWhatsAppShare = async () => {
      try {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(`${shareText}${webShareLink}`)}`;
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
        const twitterUrl = `twitter://post?message=${encodeURIComponent(`${shareText}${webShareLink}`)}`;
        const webTwitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${webShareLink}`)}`;
        
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
        const telegramUrl = `tg://msg?text=${encodeURIComponent(`${shareText}${webShareLink}`)}`;
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
          message: `${shareText}\n\n${webShareLink}`,
          title: 'Share Video'
        });
      } catch (error) {
        showToast('error', 'Failed to open share menu');
      }
    };

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
    // Show a clean, readable link for users
    const isPhotoPost = videoData.images && videoData.images.length > 0;
    const shareLink = `https://lettubbe.com/${isPhotoPost ? 'photo' : 'video'}/${videoData._id}`;
    
    const copyToClipboard = async () => {
      try {
        await Clipboard.setStringAsync(shareLink);
        showToast('success', 'Link copied to clipboard!');
      } catch (error) {
        showToast('error', 'Failed to copy link');
      }
    };

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
            {shareLink}
          </Typography>
          <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
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

      {renderTabButtons()}

      {selectedTarget === 'chats' ? (
        debouncedSearchQuery.trim() ? (
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
        )
      ) : (
        debouncedSearchQuery.trim() ? (
          isSearchingCommunities ? (
            <View style={styles.loadingContainer}>
              <Typography color={Colors[theme].textLight}>Searching communities...</Typography>
            </View>
          ) : searchedCommunities.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Typography color={Colors[theme].textLight}>No communities found</Typography>
              <Typography color={Colors[theme].textLight} size={12} style={{ marginTop: 8 }}>
                Try a different search term
              </Typography>
            </View>
          ) : (
            <FlatList
              data={searchedCommunities}
              renderItem={renderSearchCommunityItem}
              keyExtractor={(item, index) => item?._id || `search-community-${index}`}
              showsVerticalScrollIndicator={false}
              style={styles.conversationsList}
            />
          )
        ) : (
          isLoadingCommunities ? (
            <View style={styles.loadingContainer}>
              <Typography color={Colors[theme].textLight}>Loading communities...</Typography>
            </View>
          ) : !communitiesList || communitiesList.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Typography color={Colors[theme].textLight}>No communities found</Typography>
              <Typography color={Colors[theme].textLight} size={12} style={{ marginTop: 8 }}>
                Join a community to share content
              </Typography>
            </View>
          ) : (
            <FlatList
              data={filteredCommunities}
              renderItem={renderCommunityItem}
              keyExtractor={(item, index) => item.id || `community-${index}`}
              showsVerticalScrollIndicator={false}
              style={styles.conversationsList}
            />
          )
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

  const renderVideoPreview = () => {
    const targetName = selectedConversation
      ? getConversationDisplayName(selectedConversation)
      : selectedCommunity?.name || '';

    // Determine if this is a photo post
    const isPhotoPost = videoData.images && videoData.images.length > 0;

    // Get user display info with fallback to current user
    const getUserDisplayInfo = () => {
      const user = videoData.user || {} as any;
      const fallbackUser = userDetails || {} as any;
      
      return {
        profilePicture: user.profilePicture || fallbackUser.profilePicture || '',
        displayName: `${user.firstName || fallbackUser.firstName || ''} ${user.lastName || fallbackUser.lastName || ''}`.trim() || 
                    user.username || fallbackUser.username || 'Unknown User',
        username: user.username || fallbackUser.username || 'unknown'
      };
    };

    const userInfo = getUserDisplayInfo();

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

        <View style={styles.videoPreviewContainer}>
          {/* Video Card Preview */}
          <View style={styles.videoCard}>
            <View style={styles.videoCardHeader}>
              <Avatar
                imageSource={{ uri: userInfo.profilePicture }}
                size={32}
                uri
                showRing={false}
              />
              <View style={styles.userInfo}>
                <Typography weight="500" size={14} textType="textBold">
                  {userInfo.displayName}
                </Typography>
                <Typography size={12} color={Colors[theme].textLight}>
                  @{userInfo.username}
                </Typography>
              </View>
            </View>

            <View style={styles.videoThumbnailContainer}>
              {isPhotoPost ? (
                videoData.images && videoData.images.length > 1 ? (
                  // Multiple photos - use ScrollView
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(event) => {
                      const contentOffsetX = event.nativeEvent.contentOffset.x;
                      const containerWidth = event.nativeEvent.layoutMeasurement.width;
                      const index = Math.round(contentOffsetX / containerWidth);
                      setCurrentPhotoIndex(index);
                    }}
                    scrollEventThrottle={16}
                    style={styles.photoScrollView}
                  >
                    {videoData.images.map((imageUri, index) => (
                      <Image 
                        key={`photo-${index}`}
                        source={{ uri: imageUri }} 
                        style={[styles.videoThumbnail, styles.photoThumbnail, { width: screenWidth - 32 }]} 
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                ) : (
                  // Single photo
                  <Image 
                    source={{ uri: videoData.images?.[0] || videoData.thumbnail }} 
                    style={[styles.videoThumbnail, styles.photoThumbnail]} 
                    resizeMode="cover"
                  />
                )
              ) : (
                // Video
                <Image 
                  source={{ uri: videoData.thumbnail }} 
                  style={styles.videoThumbnail} 
                  resizeMode="cover"
                />
              )}
              
              {/* Only show play icon for videos */}
              {!isPhotoPost && (
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
              )}
              
              {/* Show photo count for multiple photos or duration for videos */}
              {((isPhotoPost && videoData.images && videoData.images.length > 1) || 
                (!isPhotoPost && videoData.duration)) && (
                <View style={styles.duration}>
                  <Typography size={10} color="#fff" weight="500">
                    {isPhotoPost 
                      ? `${currentPhotoIndex + 1}/${videoData.images!.length}` 
                      : formatVideoDuration(videoData.duration || '0')
                    }
                  </Typography>
                </View>
              )}
            </View>

            {videoData.description && (
              <Typography size={14} style={styles.videoDescription} numberOfLines={2}>
                {videoData.description}
              </Typography>
            )}
          </View>

          {/* Caption Input with Send Icon */}
          <View style={styles.captionContainer}>
            <TextInput
              style={[styles.captionInput, {
                backgroundColor: Colors[theme].inputBackground,
                color: Colors[theme].textBold,
                borderColor: Colors[theme].borderColor,
              }]}
              placeholder="Add a caption..."
              placeholderTextColor={Colors[theme].textLight}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={styles.sendIcon}
              onPress={handleSendVideo}
            >
              <Feather name="send" size={25} color={Colors.general.primary} />

            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Determine appropriate height based on content
  const getSheetHeight = () => {
    if (selectedConversation || selectedCommunity) {
      // If we're in preview mode, check if it's a photo post
      const isPhotoPost = videoData?.images && videoData.images.length > 0;
      return isPhotoPost ? 700 : 520; // Much taller for photos due to square aspect ratio
    }
    return 500; // Default height for conversation list
  };

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      showCloseIcon={false}
      sheetheight={getSheetHeight()}
    >
      {(selectedConversation || selectedCommunity) ? renderVideoPreview() : isSearchExpanded ? renderSearchResults() : renderConversationsList()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    // paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    paddingLeft: 12,
  },
  searchButton: {
    padding: 4,
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
  headerTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  headerTab: {
    marginRight: 24,
    paddingVertical: 12,
    width: 120,
    alignItems: 'center'
  },
  headerTabTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTabIndicator: {
    width: 120,
    height: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  activeHeaderTabIndicator: {
    backgroundColor: Colors.general.primary,
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
  shareScrollView: {
    flexGrow: 0,
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
    paddingHorizontal: 0,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoPreviewContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  videoCard: {
    marginBottom: 16,
  },
  videoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  videoThumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 380,
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9, // For videos
    borderRadius: 8,
  },
  photoThumbnail: {
    aspectRatio: 1, // Square aspect ratio for photos
  },
  photoScrollView: {
    width: '100%',
    height: '100%',
  },
  scrollPhoto: {
    width: 280,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDescription: {
    lineHeight: 18,
    paddingTop: 12
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  captionInput: {
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

export default ShareVideoModal;