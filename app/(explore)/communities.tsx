import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Community } from '@/helpers/types/chat/chat.types';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import SearchField from '@/components/ui/inputs/SearchField';
import { useGetAllCommunitiesInfinite } from '@/hooks/community/useGetAllCommunities';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';
import { useSearchCommunities } from '@/hooks/community/useSearchCommunities';
import { useJoinCommunity } from '@/hooks/community/useJoinCommunity';
import { useSendJoinRequest } from '@/hooks/community/useSendJoinRequest';
import { getCommunityTypeIcon } from '@/helpers/utils/util';
import { useCommunityStore } from '@/store/communityStore';
import { useCheckPendingJoinRequest } from '@/hooks/community/useCheckPendingJoinRequest';
import useAuth from '@/hooks/auth/useAuth';

interface CommunityItemProps {
  item: Community;
  onPress: () => void;
  onJoinPress: () => void;
  isProcessing: boolean;
}

const CommunityItemComponent: React.FC<CommunityItemProps> = ({ item, onPress, onJoinPress, isProcessing }) => {
  const { theme } = useCustomTheme();
  
  // Check pending status using the hook properly at component level
  const { hasPendingRequest: dataPendingRequest } = useCheckPendingJoinRequest((item as any)._rawData);
  const actualPendingRequest = item.hasPendingRequest || dataPendingRequest;

  return (
    <TouchableOpacity
      style={[styles.communityItem, { borderColor: Colors[theme].borderColor }]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image 
            source={{ uri: item.avatar }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
            <Typography size={20} weight="600" color={Colors[theme].textLight}>
              {item.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>
      
      <View style={styles.communityInfo}>
        <View style={styles.nameContainer}>
          <Typography weight="500" size={16} numberOfLines={1} style={styles.communityName}>
            {item.name}
          </Typography>
          <Ionicons 
            name={getCommunityTypeIcon(item.type || 'public') as any} 
            size={14} 
            color={Colors[theme].textLight} 
            style={styles.typeIcon}
          />
        </View>
        
        <Typography size={14} color={Colors[theme].textLight} numberOfLines={2} style={styles.description}>
          {item.description}
        </Typography>
        
        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={14} color={Colors[theme].textLight} />
          <Typography size={12} color={Colors[theme].textLight} style={styles.memberCountText}>
            {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
          </Typography>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        {!item.isJoined && !actualPendingRequest && (
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
                ? (item.type === 'private' ? 'Sending Request...' : 'Joining...') 
                : (item.type === 'private' ? 'Send Request' : 'Join')}
            </Typography>
          </TouchableOpacity>
        )}
        {actualPendingRequest && (
          <View style={[styles.joinButton, styles.pendingButton]}>
            <Typography 
              size={12} 
              color={Colors[theme].textLight}
            >
              Pending
            </Typography>
          </View>
        )}
        {item.isJoined && (
          <View style={[styles.joinButton, styles.joinedButton]}>
            <Typography 
              size={12} 
              color={Colors[theme].textLight}
            >
              Joined
            </Typography>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ExploreCommunities = () => {
  const { theme } = useCustomTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [processingCommunityId, setProcessingCommunityId] = useState<string | null>(null);
  const { userDetails } = useAuth();
  
  // Use global community store for pending state
  const { addPendingCommunity, removePendingCommunity, isPendingCommunity, syncWithJoinedCommunities, pendingCommunityIds } = useCommunityStore();
  
  const { 
    communities: allCommunitiesData, 
    isLoading: loadingAll,
    isFetchingNextPage,
    hasNextPage,
    handleEndReached
  } = useGetAllCommunitiesInfinite();
  const { data: joinedCommunitiesData } = useGetJoinedCommunities();
  
  // Use search when there's a search query, otherwise use all communities
  const { data: searchResults, isLoading: searchLoading } = useSearchCommunities(searchQuery, { page: 1, limit: 50 });
  const { join, isLoading: isJoining } = useJoinCommunity();
  const sendJoinRequestMutation = useSendJoinRequest();
  
  // Flatten all pages of joined communities data
  const allJoinedCommunitiesData = useMemo(() => 
    joinedCommunitiesData?.pages?.flatMap((page: any) => page?.data?.data || []) || [],
    [joinedCommunitiesData?.pages]
  );

  // Get joined community IDs for filtering
  const joinedCommunityIds = useMemo(() => 
    allJoinedCommunitiesData.map((c: any) => c._id),
    [allJoinedCommunitiesData]
  );

  // Sync pending state with joined communities when data loads
  useEffect(() => {
    if (allJoinedCommunitiesData.length > 0) {
      const joinedIds = allJoinedCommunitiesData.map((c: any) => c._id);
      syncWithJoinedCommunities(joinedIds);
    }
  }, [allJoinedCommunitiesData, syncWithJoinedCommunities]);

  
  // Transform communities function (reusable for both search and all communities)
  const transformCommunities = (communitiesData: any[]): Community[] => {
    if (!Array.isArray(communitiesData)) return [];
    
    return communitiesData.map((apiCommunity: any) => {
      const isManuallyPending = isPendingCommunity(apiCommunity._id);
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
        hasPendingRequest: isManuallyPending,
        _rawData: apiCommunity
      };
    });
  };

  // Transform all communities data
  const allCommunities: Community[] = useMemo(() => 
    transformCommunities(allCommunitiesData || []),
    [allCommunitiesData, isPendingCommunity, userDetails?._id, joinedCommunityIds]
  );

  // Transform search results data
  const searchCommunities: Community[] = useMemo(() => 
    transformCommunities(searchResults?.data?.data || []),
    [searchResults?.data?.data, isPendingCommunity, userDetails?._id, joinedCommunityIds]
  );
  
  // Use search results when searching, otherwise use all communities (filtered to exclude joined)
  const filteredCommunities = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, show search results and exclude joined communities
      return searchCommunities.filter((community: Community) => !community.isJoined);
    } else {
      // When not searching, show all communities and exclude joined communities
      return allCommunities.filter((community: Community) => !community.isJoined);
    }
  }, [searchQuery, searchCommunities, allCommunities]);

  const handleCommunityPress = (communityId: string) => {
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
          // Default to public if type is undefined
          await join(communityId);
          console.log(`Successfully joined community ${communityId}`);
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

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <CommunityItemComponent 
      item={item} 
      onPress={() => handleCommunityPress(item.id)}
      onJoinPress={() => handleJoinPress(item.id, item.isJoined, item.type)}
      isProcessing={processingCommunityId === item.id}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons
        name="search-outline"
        size={64}
        color={Colors[theme].textLight}
      />
      <Typography
        weight="600"
        size={18}
        color={Colors[theme].textBold}
        style={styles.emptyStateTitle}
      >
        No Communities Found
      </Typography>
      <Typography
        size={14}
        color={Colors[theme].textLight}
        style={styles.emptyStateSubtitle}
      >
        Try adjusting your search terms
      </Typography>
    </View>
  );

  const renderFooter = () => {
    // loading indicator when fetching next page
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={Colors.general.purple} size="small" />
        </View>
      );
    }
    
    // end message if no more pages
    if (!hasNextPage && allCommunities.length > 0) {
      return (
        <View style={styles.footer}>
          <Typography 
            size={12} 
            color={Colors[theme].textLight} 
            style={styles.footerText}
          >
            ...
          </Typography>
        </View>
      );
    }
    
    return null;
  };

  return (
    <Wrapper>
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Typography weight="600" size={18} color={Colors[theme].textBold}>
            Explore Communities
          </Typography>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchField
            placeholder="Search communities..."
            onSearch={setSearchQuery}
            initialValue={searchQuery}
          />
        </View>

        {/* Communities List */}
        <FlatList
          data={filteredCommunities}
          renderItem={renderCommunityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredCommunities.length === 0 ? styles.emptyContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={!(loadingAll || searchLoading) ? renderEmptyState : null}
          ListFooterComponent={searchQuery.trim() ? null : renderFooter}
          onEndReached={searchQuery.trim() ? null : handleEndReached}
          onEndReachedThreshold={0.1}
          removeClippedSubviews={false}
          maxToRenderPerBatch={200}
          windowSize={100}
          initialNumToRender={200}
          updateCellsBatchingPeriod={50}
          onScrollToIndexFailed={() => {}}
        />
      </SafeAreaView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 6
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityName: {
    flex: 1,
  },
  typeIcon: {
    marginLeft: 6,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  description: {
    marginBottom: 8,
    lineHeight: 18,
  },
  joinButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.general.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedButton: {
    backgroundColor: '#E5E5E5',
  },
  pendingButton: {
    backgroundColor: '#F0F0F0',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    marginLeft: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    marginLeft: 8,
  },
});

export default ExploreCommunities;