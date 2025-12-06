import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Community } from '@/helpers/types/chat/chat.types';
import FilterTabs from '@/components/shared/chat/FilterTabs';
import EmptyState from '@/components/shared/chat/EmptyState';
import FloatingButton from '@/components/shared/chat/FloatingButton';
import ScrollAwareScrollView from '@/components/ui/ScrollAwareScrollView';
import ScrollBottomSpace from '@/components/utilities/ScrollBottomSpace';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';
import { useGetAllCommunities } from '@/hooks/community/useGetAllCommunities';
import { useJoinCommunity } from '@/hooks/community/useJoinCommunity';
import { useSendJoinRequest } from '@/hooks/community/useSendJoinRequest';
import { useCheckPendingJoinRequest } from '@/hooks/community/useCheckPendingJoinRequest';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import { getCommunityTypeIcon } from '@/helpers/utils/util';
import { useCommunityStore } from '@/store/communityStore';
import useAuth from '@/hooks/auth/useAuth';

interface CommunityScreenProps {
  searchTerm?: string;
  searchResults?: any[];
  isSearching?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const CommunityScreen = ({ searchTerm = '', searchResults = [], isSearching = false, onRefresh, refreshing = false }: CommunityScreenProps) => {
  const { theme } = useCustomTheme();
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [processingCommunityId, setProcessingCommunityId] = useState<string | null>(null);
  
  // Use global community store for pending state
  const { addPendingCommunity, removePendingCommunity, isPendingCommunity, syncWithJoinedCommunities } = useCommunityStore();

  const { 
    data: joinedCommunitiesData, 
    isLoading: loadingJoined, 
    refetch: refetchJoined,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useGetJoinedCommunities();
  const { data: allCommunitiesData, isLoading: loadingAll, refetch: refetchAll } = useGetAllCommunities();
  const { join, isLoading: isJoining } = useJoinCommunity();
  const sendJoinRequestMutation = useSendJoinRequest();
  const { userDetails } = useAuth();

  // Flatten all pages of joined communities data
  const allJoinedCommunitiesData = useMemo(() => 
    joinedCommunitiesData?.pages?.flatMap((page: any) => page?.data?.data || []) || [],
    [joinedCommunitiesData?.pages]
  );

  // Sync pending state with joined communities when data loads
  useEffect(() => {
    if (allJoinedCommunitiesData.length > 0) {
      const joinedIds = allJoinedCommunitiesData.map((c: any) => c._id);
      syncWithJoinedCommunities(joinedIds);
    }
  }, [allJoinedCommunitiesData]);

  // Transform joined communities data
  const joinedCommunities: Community[] = useMemo(() => 
    allJoinedCommunitiesData.map((apiCommunity: any) => {
      // Extract member IDs from the members array
      const memberIds = (apiCommunity.members || []).map((member: any) => member._id);

      // Try different possible field names for last message
      const lastMessage = apiCommunity.lastMessage ||
        apiCommunity.lastMessageText ||
        apiCommunity.latestMessage?.text ||
        apiCommunity.recentMessage?.text ||
        null;

      return {
        id: apiCommunity._id,
        name: apiCommunity.name,
        avatar: apiCommunity.photoUrl || '',
        memberCount: apiCommunity.members?.length || 0,
        isJoined: true,
        description: apiCommunity.description,
        type: apiCommunity.type || 'public', // Add the community type field
        lastMessage: lastMessage,
        lastMessageTime: apiCommunity.lastMessageTime || apiCommunity.lastMessageAt || null,
        members: memberIds,
        membersWithProfiles: apiCommunity.members || [] // Keep the full member objects for direct access
      };
    }),
    [allJoinedCommunitiesData]
  );

  // Get joined community IDs for filtering
  const joinedCommunityIds = useMemo(() => 
    joinedCommunities.map(c => c.id),
    [joinedCommunities]
  );

  // Transform all communities and filter out joined ones, then take first 5 for recommendations
  const allCommunities: Community[] = useMemo(() => 
    (allCommunitiesData?.data?.data || []).map((apiCommunity: any) => {
      // For allCommunities, members are just strings (IDs), not objects
      const memberIds = apiCommunity.members || [];
      const isManuallyPending = isPendingCommunity(apiCommunity._id);
      
      // Check API pending state from approvals array
      const currentUserId = userDetails?._id;
      const approvals = apiCommunity.approvals || [];
      const hasApiPendingRequest = approvals.includes(currentUserId);
      
      // Combined pending state for filtering
      const hasCombinedPendingRequest = isManuallyPending || hasApiPendingRequest;

      // Check if user is owner, admin, or member
      const isOwner = userDetails?._id === apiCommunity.owner;
      const isAdmin = apiCommunity.admins?.includes(userDetails?._id);
      const isMember = apiCommunity.members?.includes(userDetails?._id);
      const isJoinedOrOwned = joinedCommunityIds.includes(apiCommunity._id) || isOwner || isAdmin || isMember;

      return {
        id: apiCommunity._id,
        name: apiCommunity.name,
        avatar: apiCommunity.photoUrl || '',
        memberCount: apiCommunity.members?.length || 0,
        isJoined: isJoinedOrOwned,
        description: apiCommunity.description,
        type: apiCommunity.type || 'public',
        lastMessage: null,
        lastMessageTime: null,
        members: memberIds,
        membersWithProfiles: [], // All communities API doesn't include profile data
        hasPendingRequest: hasCombinedPendingRequest, // Combined pending state for filtering
        _rawData: apiCommunity // Store raw data for pending check
      };
    }),
    [allCommunitiesData?.data?.data, userDetails?._id, isPendingCommunity, joinedCommunityIds]
  );

  const recommendedCommunities = useMemo(() => 
    allCommunities
      .filter((community: Community) => 
        !community.isJoined && 
        !community.hasPendingRequest
      )
      .slice(0, 5),
    [allCommunities]
  );

  // Transform search results to Community format
  const searchCommunities: Community[] = (Array.isArray(searchResults) ? searchResults : []).map((apiCommunity: any) => {
    const isManuallyPending = isPendingCommunity(apiCommunity._id);
    
    // Extract member IDs and preserve member objects for search results
    const memberIds = (apiCommunity.members || []).map((member: any) => 
      typeof member === 'string' ? member : member._id
    );
    
    return {
      id: apiCommunity._id,
      name: apiCommunity.name,
      avatar: apiCommunity.photoUrl || '',
      memberCount: apiCommunity.members?.length || 0,
      isJoined: joinedCommunityIds.includes(apiCommunity._id),
      description: apiCommunity.description,
      type: apiCommunity.type || 'public',
      lastMessage: null,
      lastMessageTime: null,
      members: memberIds,
      membersWithProfiles: apiCommunity.members || [], // Preserve member objects for profile access
      hasPendingRequest: isManuallyPending, // Only use manual pending for now
      _rawData: apiCommunity // Store raw data for pending check
    };
  });

  const communities = searchTerm ? searchCommunities : joinedCommunities;

  const handleCommunityPress = (communityId: string) => {
    console.log(`Navigating to community ${communityId}`);
    router.push(`/(community)/${communityId}`);
  };

  const handleJoinPress = async (communityId: string, isJoined: boolean, communityType?: string) => {
    if (!isJoined) {
      setProcessingCommunityId(communityId);
      try {
        if (communityType === 'private') {
          // Set manual pending state immediately for private communities
          addPendingCommunity(communityId);
          await sendJoinRequestMutation.mutateAsync(communityId);
          console.log(`Successfully sent join request for community ${communityId}`);
        } else {
          await join(communityId);
          console.log(`Successfully joined community ${communityId}`);
          // Force refresh both queries to ensure UI updates immediately
          await Promise.all([
            refetchJoined(),
            refetchAll()
          ]);
        }
      } catch (error) {
        console.error(`Failed to join/request community ${communityId}:`, error);
        // Remove from pending if request failed
        if (communityType === 'private') {
          removePendingCommunity(communityId);
        }
      } finally {
        setProcessingCommunityId(null);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchJoined(),
        refetchAll()
      ]);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to refresh communities:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom) {
      handleLoadMore();
    }
  };


  // Empty states configuration for different tabs
  const emptyStates = {
    Favorites: {
      title: "No Favorite Communities",
      subtitle: "Communities you mark as favorites will appear here",
      image: require('@/assets/images/Empty.png')
    },
    Archived: {
      title: "No Archived Communities",
      subtitle: "Communities you archive will appear here",
      image: require('@/assets/images/Empty.png')
    },
    Unread: {
      title: "No Unread Messages",
      subtitle: "You're all caught up with your community notifications",
      image: require('@/assets/images/Empty.png')
    },
    All: {
      title: "No Communities",
      subtitle: "Join or create communities to get started",
      image: require('@/assets/images/Empty.png')
    }
  };

  const renderContent = () => {
    if (activeTab === 'All') {
      // Show loading state
      if (loadingJoined && !communities.length) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[theme].textLight} />
            <Typography style={{ marginTop: 12 }}>Loading communities...</Typography>
          </View>
        );
      }

      return (
        <>
          {/* Search Results or My Communities */}
          {communities.length > 0 && (
            <>
              {searchTerm && (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Typography weight="600" size={16} color={Colors[theme].textBold}>
                      Search Results
                    </Typography>
                  </View>
                </View>
              )}
              {communities.map((community) => (
                <CommunityItem
                  key={community.id}
                  community={community}
                  onPress={() => handleCommunityPress(community.id)}
                  onJoinPress={() => handleJoinPress(community.id, community.isJoined, community.type)}
                  isProcessing={processingCommunityId === community.id}
                />
              ))}
            </>
          )}

          {/* Recommended Communities - only show when not searching */}
          {/* {!searchTerm && recommendedCommunities.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Typography weight="600" size={16} color={Colors[theme].textBold}>
                    Recommended Communities
                  </Typography>
                </View>
              </View>

              {recommendedCommunities.map((community) => (
                <CommunityItem
                  key={`recommended-${community.id}`}
                  community={community}
                  onPress={() => handleCommunityPress(community.id)}
                  onJoinPress={() => handleJoinPress(community.id, community.isJoined, community.type)}
                  isProcessing={processingCommunityId === community.id}
                />
              ))}
            </>
          )} */}

          {/* Empty state */}
          {!loadingJoined && communities.length === 0 && (
            <EmptyState
              title={searchTerm ? "No communities found" : emptyStates.All.title}
              subtitle={searchTerm ? `No communities match "${searchTerm}"` : emptyStates.All.subtitle}
              image={emptyStates.All.image}
            />
          )}
        </>
      );
    }

    // Show appropriate empty state for other tabs
    const emptyState = emptyStates[activeTab];
    return (
      <EmptyState
        title={emptyState.title}
        subtitle={emptyState.subtitle}
        image={emptyState.image}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* <FilterTabs
        activeTab={activeTab}
        onTabPress={setActiveTab}
      /> */}

      <ScrollAwareScrollView
        style={styles.communityList}
        contentContainerStyle={
          activeTab !== 'All' || communities.length === 0
            ? styles.emptyStateContainer
            : undefined
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loadingJoined || loadingAll}
            onRefresh={handleRefresh}
            tintColor={Colors[theme].cardBackground}
            colors={[Colors[theme].cardBackground]}
          />
        }
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <Typography>Searching communities...</Typography>
          </View>
        ) : (
          <>
            {renderContent()}
            {/* Loading indicator for pagination */}
            {isFetchingNextPage && (
              <View style={styles.paginationLoadingContainer}>
                <ActivityIndicator size="small" color={Colors[theme].textLight} />
              </View>
            )}
          </>
        )}
        <ScrollBottomSpace />
      </ScrollAwareScrollView>

      <FloatingButton
        icon="add-outline"
        onPress={() => router.push('/(community)/create-step1')}
      />
    </View>
  );
};

interface MemberAvatarsProps {
  memberIds: string[];
  memberCount: number;
  isJoined: boolean;
  membersWithProfiles?: Array<{
    _id: string;
    profilePicture?: string;
    username?: string;
  }>;
}

const MemberAvatars: React.FC<MemberAvatarsProps> = ({ memberIds, memberCount, isJoined, membersWithProfiles }) => {
  const { theme } = useCustomTheme();

  // Only display the first 4 members
  const displayMemberIds = memberIds.slice(0, 4);

  return (
    <View style={styles.memberAvatarsContainer}>
      {displayMemberIds.map((memberId, index) => {
        const memberData = membersWithProfiles?.find(m => m._id === memberId);

        return (
          <MemberAvatar
            key={`${memberId}-${index}`}
            memberId={memberId}
            index={index}
            isJoined={isJoined}
            memberData={memberData}
          />
        );
      })}
      <Typography size={12} color={Colors[theme].textLight} style={styles.memberCountText}>
        {memberCount} member{memberCount !== 1 ? 's' : ''}
      </Typography>
    </View>
  );
};

interface MemberAvatarProps {
  memberId: string;
  index: number;
  isJoined: boolean;
  memberData?: {
    _id: string;
    profilePicture?: string;
    username?: string;
  };
}

const MemberAvatar: React.FC<MemberAvatarProps> = React.memo(({ memberId, index, isJoined, memberData }) => {
  // Only fetch profile if we don't have complete member data AND we actually need it
  const needsProfileFetch = !memberData?.profilePicture && memberId;
  const { data: profileData,} = useGetPublicProfile(needsProfileFetch ? memberId : '');

  // Use memberData if available, otherwise fall back to profileData
  const profilePicture = memberData?.profilePicture || profileData?.profilePicture;
  const username = memberData?.username || profileData?.username;


  const handleMemberPress = () => {
    // Add safety check
    if (!memberId) {
      console.warn('Cannot navigate to profile: missing member ID');
      return;
    }

    const profileParams = new URLSearchParams({
      userId: memberId,
      username: username || "Unknown User",
      displayName: username || "Unknown User", 
      subscriberCount: "0",
      avatar: profilePicture || "",
    });
    
    // router.push(`/(chat)/${memberId}/Profile?${profileParams.toString()}` as any);
  };

  return (
    <TouchableOpacity
      onPress={handleMemberPress}
      activeOpacity={0.7}
      disabled={!memberId}
      style={[
        styles.memberAvatar,
        {
          marginLeft: index === 0 ? 0 : -8,
          zIndex: 4 - index
        }
      ]}
    >
      {profilePicture ? (
        <Image
          source={{ uri: profilePicture }}
          style={styles.memberAvatarImage}
        />
      ) : (
        <View style={[styles.memberAvatarImage, styles.memberAvatarPlaceholder]}>
          <Typography
            size={8}
            weight="600"
            color="#666"
          >
            {username?.charAt(0).toUpperCase() || 'U'}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
});

interface CommunityItemProps {
  community: Community;
  onPress: () => void;
  onJoinPress: () => void;
  isProcessing?: boolean;
}

const CommunityItem = React.memo(({ community, onPress, onJoinPress, isProcessing }: CommunityItemProps) => {
  const { theme } = useCustomTheme();
  
  // Check pending status using the hook properly at component level
  const { hasPendingRequest: dataPendingRequest } = useCheckPendingJoinRequest((community as any)._rawData);
  const actualPendingRequest = community.hasPendingRequest || dataPendingRequest;

  // Function to check if message is a video link
  const isVideoMessage = (text: string) => {
    const videoLinkPattern = /^lettubbe:\/\/video\/([^?]+)\?data=(.+)$/;
    return videoLinkPattern.test(text);
  };

  // Function to get display text for message
  const getMessageDisplayText = (message: string) => {
    if (!message) return null;

    if (isVideoMessage(message)) {
      return "shared a post";
    }

    return message;
  };


  return (
    <>
      <TouchableOpacity
        style={styles.communityItem}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          {community.avatar ? (
            <Image
              source={{ uri: community.avatar }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Typography size={20} weight="600" color={Colors[theme].textLight}>
                {community.name.charAt(0).toUpperCase()}
              </Typography>
            </View>
          )}
        </View>
        <View style={styles.communityInfo}>
          <View style={styles.communityContent}>
            <View style={styles.communityDetails}>
              <View style={styles.nameContainer}>
                <Typography weight="500" size={14} numberOfLines={1} style={styles.communityName}>{community.name}</Typography>
                <Ionicons 
                  name={getCommunityTypeIcon(community.type || 'public') as any} 
                  size={12} 
                  color={Colors[theme].textLight} 
                  style={styles.typeIcon}
                />
              </View>
              {community.lastMessage && community.lastMessage.trim() !== '' ? (
                // Show last message if it exists
                <Typography size={14} color={Colors[theme].textLight} numberOfLines={1}>
                  {getMessageDisplayText(community.lastMessage)}
                </Typography>
              ) : (
                // Show member avatars for all communities without messages
                <MemberAvatars
                  memberIds={community.members || []}
                  memberCount={community.memberCount}
                  isJoined={community.isJoined}
                  membersWithProfiles={community.membersWithProfiles}
                />
              )}
            </View>
            {!community.isJoined && !actualPendingRequest && (
              <View style={styles.joinButtonContainer}>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={onJoinPress}
                  disabled={isProcessing}
                >
                  <Typography
                    size={12}
                    color="white"
                  >
                    {isProcessing 
                      ? (community.type === 'private' ? 'Sending Request...' : 'Joining...') 
                      : (community.type === 'private' ? 'Send Request' : 'Join')}
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
            {actualPendingRequest && (
              <View style={styles.joinButtonContainer}>
                <View style={[styles.joinButton, styles.pendingButton]}>
                  <Typography
                    size={12}
                    color="#666"
                  >
                    Pending
                  </Typography>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {/* Separator */}
      {/* <View style={[styles.separator, { backgroundColor: Colors[theme].borderColor }]} /> */}
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  communityList: {
    flex: 1,
  },
  emptyStateContainer: {
    flexGrow: 1,
  },
  communityItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  communityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityDetails: {
    flex: 1,
    marginRight: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityName: {
    flexShrink: 1,
  },
  typeIcon: {
    marginLeft: 4,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  joinButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  joinButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.general.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingButton: {
    backgroundColor: '#F0F0F0',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberCountText: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  paginationLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  memberAvatarPlaceholder: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityScreen;