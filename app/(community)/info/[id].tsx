import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import { formatNumber } from '@/helpers/utils/formatting';
import { useGetCommunity } from '@/hooks/community/useGetCommunity';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';
import { useLeaveCommunity } from '@/hooks/community/useLeaveCommunity';
import { useJoinCommunity } from '@/hooks/community/useJoinCommunity';
import { useCommunityMembers } from '@/hooks/community/useCommunityMembers';
import { useSendJoinRequest } from '@/hooks/community/useSendJoinRequest';
import { useAddAdmins } from '@/hooks/community/useAddAdmins';
import { useApproveRequest, useDenyRequest } from '@/hooks/community/useCommunityRequests';
import { useCheckPendingJoinRequest } from '@/hooks/community/useCheckPendingJoinRequest';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import Wrapper from '@/components/utilities/Wrapper';
import { getCommunityTypeIcon } from '@/helpers/utils/util';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import CommunityInviteModal from '@/components/shared/chat/CommunityInviteModal';
import UserProfileBottomSheet from '@/components/ui/Modals/UserProfileBottomSheet';
import MemberActionModal from '@/components/shared/community/MemberActionModal';
import { useRemoveMember } from '@/hooks/community/useRemoveMember';
import { useDemoteAdmin } from '@/hooks/community/useDemoteAdmin';
import useAuth from '@/hooks/auth/useAuth';
import { useGetUserIdState } from '@/store/UsersStore';

type TabType = 'members' | 'media' | 'links' | 'stickers' | 'requests';

interface CommunityMemberDetailed {
  _id: string;
  username: string;
  profilePicture?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  isLoading?: boolean;
  isError?: boolean;
}

const CommunityInfoScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFullScreenSearch, setShowFullScreenSearch] = useState(false);
  const [isProcessingJoin, setIsProcessingJoin] = useState(false);
  const [selectedMembersForAdmin, setSelectedMembersForAdmin] = useState<string[]>([]);
  const [isAdminManagementMode, setIsAdminManagementMode] = useState(false);
  const [showUserProfileBottomSheet, setShowUserProfileBottomSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMemberDetailed | null>(null);
  const [showMemberActionModal, setShowMemberActionModal] = useState(false);
  const [memberForAction, setMemberForAction] = useState<CommunityMemberDetailed | null>(null);
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { setUserId: setChatUserId } = useGetUserIdState();
  const queryClient = useQueryClient();

  // Refresh community data when screen comes into focus (after adding members)
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        // Invalidate and refetch community data when screen gains focus
        queryClient.invalidateQueries({ queryKey: ['community', id] });
        queryClient.invalidateQueries({ queryKey: ['communityMembers'] });
      }
    }, [id, queryClient])
  );

  // Fetch community data
  const { data: communityResponse, isLoading: isCommunityLoading } = useGetCommunity(id as string);
  const { data: joinedCommunitiesData } = useGetJoinedCommunities();
  const { leave, isLoading: isLeaving } = useLeaveCommunity();
  const { join, isLoading: isJoining } = useJoinCommunity();
  const sendJoinRequestMutation = useSendJoinRequest();
  const addAdminsMutation = useAddAdmins();
  
  // Community requests hooks (for approve/deny actions)
  const { approveRequest, isLoading: isApprovingRequest } = useApproveRequest();
  const { denyRequest, isLoading: isDenyingRequest } = useDenyRequest();
  
  // Member management hooks
  const removeMemberMutation = useRemoveMember();
  const demoteAdminMutation = useDemoteAdmin();

  const apiCommunity = communityResponse?.data;

  // Extract member IDs from community data
  const memberIds = apiCommunity?.members?.map((member: any) => member._id || member) || [];

  // Fetch detailed member information
  const { members: detailedMembers, isLoading: isMembersLoading } = useCommunityMembers(memberIds);

  // Extract request IDs and fetch detailed request information
  const requestIds = apiCommunity?.approvals || [];
  const { members: detailedRequests, isLoading: isRequestsLoading } = useCommunityMembers(requestIds);

  // Fetch owner profile
  const { data: ownerProfile } = useGetPublicProfile(apiCommunity?.owner || '');

  // Format creation date
  const formatCreationDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };
  const communityData = {
    _id: apiCommunity?._id || id,
    name: apiCommunity?.name || 'Community',
    description: apiCommunity?.description || 'Welcome to our community!',
    photoUrl: apiCommunity?.photoUrl || '',
    memberCount: apiCommunity?.members?.length || 0,
    type: apiCommunity?.type || 'public',
    owner: apiCommunity?.owner || null,
    members: apiCommunity?.members || [],
    createdAt: apiCommunity?.createdAt,
    admins: apiCommunity?.subAdmins?.map((admin: any) => admin._id) || [],
  };

  // Check if user is a member
  const joinedCommunityIds = (
    joinedCommunitiesData?.pages?.flatMap(page => {
      if (page && typeof page === 'object' && 'data' in page && Array.isArray((page as any).data?.data)) {
        return (page as any).data.data;
      }
      return [];
    }) || []
  ).map((c: any) => c._id);
  const isUserMember = joinedCommunityIds.includes(id);

  // Check if user is the owner
  const isOwner = userDetails?._id === communityData.owner;
  
  // Check if user is an admin (includes owner)
  const isAdmin = isOwner || (communityData.admins && communityData.admins.includes(userDetails?._id || ''));
  
  // Check if current user has admin privileges (owner or admin)
  const hasAdminPrivileges = isAdmin;

  // Check if user has pending request
  const { hasPendingRequest } = useCheckPendingJoinRequest(apiCommunity);

  // Filter members based on search query
  const filteredMembers = detailedMembers.filter(member => {
    if (!memberSearchQuery) return true;
    const searchLower = memberSearchQuery.toLowerCase();
    const displayName = member.displayName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || '';
    const username = member.username || '';
    return displayName.toLowerCase().includes(searchLower) || username.toLowerCase().includes(searchLower);
  });

  const handleBack = () => {
    router.back();
  };

  const handleJoinCommunity = async () => {
    setIsProcessingJoin(true);
    try {
      if (communityData.type === 'private') {
        await sendJoinRequestMutation.mutateAsync(id as string);
      } else {
        await join(id as string);
      }
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setIsProcessingJoin(false);
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      await leave(id as string);
      setShowLeaveAlert(false);
      // Navigate to Communities tab after leaving
      router.replace({
        pathname: '/(tabs)/chat',
        params: { tab: 'communities' }
      });
    } catch (error) {
      console.error('Error leaving community:', error);
      setShowLeaveAlert(false);
    }
  };

  const handleLeaveConfirmation = () => {
    setShowLeaveAlert(true);
  };

  const handleCancelLeave = () => {
    setShowLeaveAlert(false);
  };

  const handleMenuOptionSelect = (option: string) => {
    switch (option) {
      case 'Edit Community':
        router.push(`/(community)/edit/${id}`);
        break;
      // case 'Invite Members':
      //   setShowInviteModal(true);
      //   break;
      // case 'Requests':
      //   router.push(`/(community)/requests/${id}`);
      //   break;
      case 'Leave Community':
        handleLeaveConfirmation();
        break;
      case 'Share Community':
        setShowInviteModal(true);
        break;
      case 'Report Community':
        console.log('Report community');
        break;
      default:
        console.log('Unknown menu option:', option);
    }
  };

  const handleAddMembers = () => {
    router.push(`/(community)/add-members/${id}`);
  };

  const handleInviteViaLink = () => {
    setShowInviteModal(true);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
  };

  const handleOpenSearch = () => {
    setShowFullScreenSearch(true);
  };

  const handleCloseSearch = () => {
    setShowFullScreenSearch(false);
    setMemberSearchQuery('');
  };

  const handleToggleAdminMode = () => {
    setIsAdminManagementMode(!isAdminManagementMode);
    setSelectedMembersForAdmin([]);
  };

  const handleSelectMemberForAdmin = (memberId: string) => {
    setSelectedMembersForAdmin(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddAdmins = async () => {
    if (selectedMembersForAdmin.length === 0) return;
    
    try {
      await addAdminsMutation.mutateAsync({
        communityId: id as string,
        memberIds: selectedMembersForAdmin
      });
      setSelectedMembersForAdmin([]);
      setIsAdminManagementMode(false);
    } catch (error) {
      console.error('Failed to add admins:', error);
    }
  };

  // Request handling functions
  const handleApproveRequest = async (memberId: string) => {
    try {
      await approveRequest(id as string, memberId);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleDenyRequest = async (memberId: string) => {
    try {
      await denyRequest(id as string, memberId);
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };

  const handleMemberClick = (member: CommunityMemberDetailed) => {
    // If it's the current user, navigate to profile tab
    if (member._id === userDetails?._id) {
      router.push("/(tabs)/profile");
    }
    // For other members, do nothing on tap - only long press shows actions
  };

  const handleMemberLongPress = (member: CommunityMemberDetailed) => {
    console.log('Long press triggered for member:', member.username);
    
    // Don't show action modal for current user or if it's the same as current user
    if (member._id === userDetails?._id) {
      console.log('Ignoring long press on current user');
      return;
    }
    
    console.log('Setting member for action and showing modal');
    setMemberForAction(member);
    setShowMemberActionModal(true);
  };

  const handleMessageMember = () => {
    if (!memberForAction) return;
    
    const displayName = memberForAction.displayName || 
      `${memberForAction.firstName || ''} ${memberForAction.lastName || ''}`.trim() || 
      memberForAction.username || 'Unknown User';
    
    console.log('handleMessageMember: Setting chat user ID to:', memberForAction._id);
    
    // Clear any previous chat state and set the new user ID
    setChatUserId(memberForAction._id);
    
    // Navigate directly to chat inbox with this member
    router.push({
      pathname: '/(chat)/[Id]/Inbox',
      params: {
        Id: memberForAction._id,
        username: memberForAction.username,
        displayName: displayName,
        userId: memberForAction._id,
        avatar: memberForAction.profilePicture || '',
        subscriberCount: 0,
      },
    });
  };

  const handleViewProfile = () => {
    if (!memberForAction) return;
    
    setSelectedMember(memberForAction);
    setShowUserProfileBottomSheet(true);
  };

  const handleRemoveMember = async () => {
    if (!memberForAction || !id) return;
    
    try {
      await removeMemberMutation.mutateAsync({
        communityId: id as string,
        userId: memberForAction._id
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleDemoteAdmin = async () => {
    if (!memberForAction || !id) return;
    
    try {
      await demoteAdminMutation.mutateAsync({
        communityId: id as string,
        adminId: memberForAction._id
      });
    } catch (error) {
      console.error('Failed to demote admin:', error);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!memberForAction || !id) return;
    
    try {
      await addAdminsMutation.mutateAsync({
        communityId: id as string,
        memberIds: [memberForAction._id]
      });
    } catch (error) {
      console.error('Failed to promote to admin:', error);
    }
  };


  const renderHeader = () => (
    <>
      <View style={styles.avatarWrapper}>
        {communityData.photoUrl ? (
          <Avatar
            imageSource={{ uri: communityData.photoUrl }}
            size={100}
            uri
            ringColor={Colors[theme].avatar}
            ringThickness={3}
            showRing={false}
            expandable={true}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: 100, height: 100, borderRadius: 50 }]}>
            <Typography size={40} weight="600" color={Colors[theme].textLight}>
              {communityData.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: Colors[theme].cardBackground }]}>
        {/* Community Info */}
        <Typography
          textType="textBold"
          size={18}
          weight="600"
          align="center"
          style={styles.nameStyle}
        >
          {communityData.name}
        </Typography>

        <View style={styles.communityInfoContainer}>
          <Typography
            color={Colors[theme].textBold}
            size={14}
            align="center"
            style={styles.membersStyle}
          >
            {formatNumber(communityData.memberCount)} member{communityData.memberCount !== 1 ? 's' : ''} • 
          </Typography>
          <Ionicons 
            name={getCommunityTypeIcon(communityData.type || 'public') as any} 
            size={14} 
            color={Colors[theme].text} 
            style={styles.communityTypeIcon}
          />
          <Typography
            color={Colors[theme].text}
            size={14}
            align="center"
          >
            {communityData.type || 'public'}
          </Typography>
        </View>

        {/* Created by information */}
        {ownerProfile && communityData.createdAt && (
          <Typography
            color={Colors[theme].textLight}
            size={12}
            align="center"
            style={styles.createdByStyle}
          >
            Created by {ownerProfile.displayName || ownerProfile.username || 'Unknown'}, on {formatCreationDate(communityData.createdAt)}
          </Typography>
        )}

        <Typography
          color={Colors[theme].text}
          size={14}
          align="center"
          style={styles.descriptionStyle}
          lineHeight={20}
        >
          {communityData.description}
        </Typography>

        {/* Join Button - only show for non-members and non-owners */}
        {!isUserMember && !isOwner && (
          <View style={styles.actionButtonContainer}>
            <AppButton
              title={
                hasPendingRequest
                  ? 'Pending Request'
                  : isProcessingJoin
                  ? (communityData.type === 'private' ? 'Sending Request...' : 'Joining...')
                  : (communityData.type === 'private' ? 'Send Request' : 'Join Community')
              }
              handlePress={handleJoinCommunity}
              disabled={isProcessingJoin || hasPendingRequest}
              variant="profile"
            />
          </View>
        )}
      </View>

      {/* Tabs with Search Icon - Only show for public communities OR members/owners of private communities */}
      {(communityData.type === 'public' || isUserMember || isOwner) && (
        <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContentContainer}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Typography
              color={activeTab === 'members' ? '#fff' : Colors[theme].text}
              weight={activeTab === 'members' ? '500' : '400'}
            >
              Members
            </Typography>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.tab, activeTab === 'media' && styles.activeTab]}
            onPress={() => setActiveTab('media')}
          >
            <Typography
              color={activeTab === 'media' ? '#fff' : Colors[theme].text}
              weight={activeTab === 'media' ? '500' : '400'}
            >
              Media
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'links' && styles.activeTab]}
            onPress={() => setActiveTab('links')}
          >
            <Typography
              color={activeTab === 'links' ? '#fff' : Colors[theme].text}
              weight={activeTab === 'links' ? '500' : '400'}
            >
              Links
            </Typography>
          </TouchableOpacity> */}

          {/* <TouchableOpacity
            style={[styles.tab, activeTab === 'stickers' && styles.activeTab]}
            onPress={() => setActiveTab('stickers')}
          >
            <Typography
              color={activeTab === 'stickers' ? '#fff' : Colors[theme].text}
              weight={activeTab === 'stickers' ? '500' : '400'}
            >
              Stickers
            </Typography>
          </TouchableOpacity> */}

          {/* Requests Tab - Only for admins/owners */}
          {hasAdminPrivileges && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Typography
                color={activeTab === 'requests' ? '#fff' : Colors[theme].text}
                weight={activeTab === 'requests' ? '500' : '400'}
              >
                Requests
              </Typography>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Search Icon - Always reserve space, only visible for members tab */}
        <TouchableOpacity
          style={[
            styles.searchIconButton,
            { 
              opacity: activeTab === 'members' ? 1 : 0,
              backgroundColor: Colors[theme].background 
            }
          ]}
          onPress={activeTab === 'members' ? handleOpenSearch : undefined}
          disabled={activeTab !== 'members'}
        >
          <Ionicons name="search" size={22} color={Colors[theme].text} />
        </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderMembersHeader = () => (
    <>
      {/* Admin Controls - Show for owner and admins */}
      {hasAdminPrivileges && !isAdminManagementMode && (
        <View style={styles.adminControls}>
          {/* Add Members Button */}
          <TouchableOpacity
            style={styles.adminButton}
            onPress={handleAddMembers}
          >
            <View style={[styles.addButton, { backgroundColor: Colors.general.primary }]}>
              <Ionicons name="person-add" size={16} color="white" />
            </View>
            <Typography size={12} weight="500" style={{ marginLeft: 4 }}>
              Add Members
            </Typography>
          </TouchableOpacity>

          {/* Invite Members Button */}
          <TouchableOpacity
            style={styles.adminButton}
            onPress={handleInviteViaLink}
          >
            <View style={[styles.addButton, { backgroundColor: Colors[theme].cardBackground, borderWidth: 1, borderColor: Colors[theme].borderColor }]}>
              <Ionicons name="share-outline" size={16} color={Colors[theme].text} />
            </View>
            <Typography size={12} color={Colors[theme].text} weight="500" style={{ marginLeft: 4 }}>
              Share Community
            </Typography>
          </TouchableOpacity>

          {/* Manage Admins - Only for owners */}
          {isOwner && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleToggleAdminMode}
            >
              <View style={[styles.addButton, { backgroundColor: Colors[theme].cardBackground, borderWidth: 1, borderColor: Colors[theme].borderColor }]}>
                <Ionicons name="shield" size={16} color={Colors[theme].text} />
              </View>
              <Typography size={12} color={Colors[theme].text} weight="500" style={{ marginLeft: 4 }}>
                Manage Admins
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Admin Management Mode Controls */}
      {isOwner && isAdminManagementMode && (
        <View style={styles.adminManagementControls}>
          <View style={styles.adminManagementHeader}>
            <Typography size={14} weight="500" color={Colors[theme].text}>
              Select members to promote to admin
            </Typography>
            <TouchableOpacity onPress={handleToggleAdminMode}>
              <Ionicons name="close" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          </View>
          
          {selectedMembersForAdmin.length > 0 && (
            <View style={styles.adminManagementActions}>
              <AppButton
                title={`Add ${selectedMembersForAdmin.length} Admin${selectedMembersForAdmin.length > 1 ? 's' : ''}`}
                handlePress={handleAddAdmins}
                disabled={addAdminsMutation.isPending}
                variant="compact"
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      )}


    </>
  );

  const renderMemberItem = ({ item }: { item: CommunityMemberDetailed }) => {
    const displayName = item.displayName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || 'Unknown User';
    const isOwner = item._id === communityData.owner;
    const isAdmin = communityData.admins && communityData.admins.includes(item._id);
    const isCurrentUser = item._id === userDetails?._id;
    const canSelectForAdmin = isAdminManagementMode && !isOwner && !isAdmin && !isCurrentUser;
    const isSelected = selectedMembersForAdmin.includes(item._id);

    if (item.isLoading) {
      return (
        <View style={styles.memberItem}>
          <View style={[styles.memberAvatarSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
          <View style={styles.memberInfo}>
            <View style={[styles.memberNameSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
            <View style={[styles.memberUsernameSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
          </View>
        </View>
      );
    }

    if (item.isError) {
      return null; // Don't render failed members
    }

    return (
      <TouchableOpacity 
        style={[
          styles.memberItem,
          canSelectForAdmin && isSelected && { backgroundColor: Colors[theme].cardBackground }
        ]}
        onPress={canSelectForAdmin ? () => handleSelectMemberForAdmin(item._id) : () => handleMemberClick(item)}
        onLongPress={() => {
          console.log('Long press detected, canSelectForAdmin:', canSelectForAdmin);
          if (!canSelectForAdmin) {
            handleMemberLongPress(item);
          }
        }}
        delayLongPress={500}
      >
        <Avatar
          imageSource={{ uri: item.profilePicture || '' }}
          size={48}
          uri
          showRing={false}
        />
        <View style={styles.memberInfo}>
          <View style={styles.memberTextInfo}>
            <Typography weight="500" textType="textBold">
              {displayName}
            </Typography>
            <Typography size={12} color={Colors[theme].textLight}>
              @{item.username || 'unknown'}
            </Typography>
          </View>
          <View style={styles.memberBadgesContainer}>
            {isOwner && (
              <View style={[styles.ownerBadge, { backgroundColor: Colors[theme].cardBackground }]}>
                <Typography size={10} weight="500">
                  Owner
                </Typography>
              </View>
            )}
            {!isOwner && isAdmin && (
              <View style={styles.adminBadge}>
                <Typography size={10} weight="500">
                  Admin
                </Typography>
              </View>
            )}
          </View>
        </View>
        {canSelectForAdmin && (
          <View style={styles.selectionIndicator}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? Colors.general.primary : Colors[theme].textLight} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color={Colors[theme].textLight} />
            <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
              No media shared yet
            </Typography>
            <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
              Shared photos and videos will appear here
            </Typography>
          </View>
        );
      case 'links':
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="link-outline" size={48} color={Colors[theme].textLight} />
            <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
              No shared links yet
            </Typography>
            <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
              Shared links will appear here
            </Typography>
          </View>
        );
      case 'stickers':
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="happy-outline" size={48} color={Colors[theme].textLight} />
            <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
              No stickers shared yet
            </Typography>
            <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
              Shared stickers and GIFs will appear here
            </Typography>
          </View>
        );
      case 'requests':
        // Use detailed requests with user information, filter out error states
        const requests = detailedRequests?.filter(request => !request?.isError) || [];
        
        // Debug logging
        // console.log('Community data approvals (IDs):', apiCommunity?.approvals);
        // console.log('Detailed requests (with user data):', requests);
        
        if (isCommunityLoading || isRequestsLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.general.primary} />
              <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
                Loading requests...
              </Typography>
            </View>
          );
        }
        
        if (!Array.isArray(requests) || requests.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons name="person-add-outline" size={48} color={Colors[theme].textLight} />
              <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                No pending requests
              </Typography>
              <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                Join requests will appear here
              </Typography>
            </View>
          );
        }
        
        return (
          <View style={styles.requestsContainer}>
            {requests.map((request: any, index: number) => {
              const requestId = request?._id || request?.id || `request-${index}`;
              const username = request?.username || 'unknown';
              const firstName = request?.firstName;
              const lastName = request?.lastName;
              const profilePicture = request?.profilePicture;
              
              // Show loading state for individual requests still being fetched
              if (request?.isLoading) {
                return (
                  <View key={requestId} style={[styles.requestItem, { backgroundColor: Colors[theme].cardBackground }]}>
                    <View style={[styles.memberAvatarSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
                    <View style={styles.requestInfo}>
                      <View style={[styles.memberNameSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
                      <View style={[styles.memberUsernameSkeleton, { backgroundColor: Colors[theme].borderColor }]} />
                    </View>
                  </View>
                );
              }
              
              return (
                <View key={requestId} style={[styles.requestItem, { backgroundColor: Colors[theme].cardBackground }]}>
                  <Avatar
                    imageSource={{ uri: profilePicture || '' }}
                    size={48}
                    uri={!!profilePicture}
                    showRing={false}
                  />
                  <View style={styles.requestInfo}>
                    <Typography weight="500" textType="textBold">
                      {firstName && lastName 
                        ? `${firstName} ${lastName}` 
                        : username}
                    </Typography>
                    <Typography size={12} color={Colors[theme].textLight}>
                      @{username}
                    </Typography>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.approveButton]}
                      onPress={() => handleApproveRequest(requestId)}
                      disabled={isApprovingRequest || isDenyingRequest}
                    >
                      <Typography size={12} weight="500" color="white">
                        Approve
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.denyButton, { borderColor: Colors[theme].borderColor }]}
                      onPress={() => handleDenyRequest(requestId)}
                      disabled={isApprovingRequest || isDenyingRequest}
                    >
                      <Typography size={12} weight="500" color={Colors[theme].text}>
                        Deny
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        );
      default:
        return null;
    }
  };

  if (isCommunityLoading && !apiCommunity) {
    return (
      <Wrapper>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.fullPageLoadingContainer}>
            <ActivityIndicator size="large" color={Colors.general.primary} />
            <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
              Loading community info...
            </Typography>
          </View>
        </SafeAreaView>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].icon} />
          </TouchableOpacity>

          {/* Only show menu if user has available options */}
          {(hasAdminPrivileges || isUserMember) && (
            <Menu>
              <MenuTrigger>
                <View style={[styles.moreButton, { backgroundColor: Colors[theme].background }]}>
                  <Ionicons name="ellipsis-vertical" size={24} color={Colors[theme].icon} />
                </View>
              </MenuTrigger>

              <MenuOptions
                customStyles={{
                  optionsContainer: {
                    borderRadius: 8,
                    padding: 10,
                    backgroundColor: Colors[theme].cardBackground,
                    width: 180,
                    zIndex: 9999,
                    elevation: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                  },
                }}
              >
              {/* Edit Community - only show for owner and admins */}
              {hasAdminPrivileges && (
                <MenuOption onSelect={() => handleMenuOptionSelect('Edit Community')}>
                  <View style={styles.menuOption}>
                    <Typography
                      weight="500"
                      size={13}
                      lineHeight={24}
                      textType="textBold"
                    >
                      Edit Community
                    </Typography>
                  </View>
                </MenuOption>
              )}

              {/* Invite Members - show for all members */}
              {/* {isUserMember && (
                <MenuOption onSelect={() => handleMenuOptionSelect('Invite Members')}>
                  <View style={styles.menuOption}>
                    <Typography
                      weight="500"
                      size={13}
                      lineHeight={24}
                      textType="textBold"
                    >
                      Invite Members
                    </Typography>
                  </View>
                </MenuOption>
              )} */}

              {/* Requests - only show for owner and admins of private communities */}
              {/* {hasAdminPrivileges && communityData.type === 'private' && (
                <MenuOption onSelect={() => handleMenuOptionSelect('Requests')}>
                  <View style={styles.menuOption}>
                    <Typography
                      weight="500"
                      size={13}
                      lineHeight={24}
                      textType="textBold"
                    >
                      Requests
                    </Typography>
                  </View>
                </MenuOption>
              )} */}

              <MenuOption onSelect={() => handleMenuOptionSelect('Share Community')}>
                <View style={styles.menuOption}>
                  <Typography
                    weight="500"
                    size={13}
                    lineHeight={24}
                    textType="textBold"
                  >
                    Share Community
                  </Typography>
                </View>
              </MenuOption>

              {isUserMember && !hasAdminPrivileges && (
                <MenuOption onSelect={() => handleMenuOptionSelect('Leave Community')}>
                  <View style={styles.menuOption}>
                    <Typography
                      weight="500"
                      size={13}
                      lineHeight={24}
                      color="#FF4444"
                    >
                      Leave Community
                    </Typography>
                  </View>
                </MenuOption>
              )}

              {/* <MenuOption onSelect={() => handleMenuOptionSelect('Report Community')}>
                <View style={styles.menuOption}>
                  <Typography
                    weight="500"
                    size={13}
                    lineHeight={24}
                    textType="textBold"
                  >
                    Report Community
                  </Typography>
                </View>
              </MenuOption> */}
              </MenuOptions>
            </Menu>
          )}
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {/* Only show tab content for public communities OR members/owners of private communities */}
          {(communityData.type === 'public' || isUserMember || isOwner) && activeTab === 'members' ? (
            <>
              {renderMembersHeader()}
              {isCommunityLoading || (memberIds.length > 0 && isMembersLoading) ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.general.primary} />
                  <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
                    Loading members...
                  </Typography>
                </View>
              ) : filteredMembers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={Colors[theme].textLight} />
                  <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                    No members yet
                  </Typography>
                  <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                    Community members will appear here
                  </Typography>
                </View>
              ) : (
                <View style={styles.membersList}>
                  {filteredMembers.map((member) => (
                    <View key={member._id}>
                      {renderMemberItem({ item: member })}
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (communityData.type === 'public' || isUserMember || isOwner) ? (
            renderTabContent()
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Leave Community Alert */}
      <CustomAlert
        visible={showLeaveAlert}
        title="Leave Community"
        message="Are you sure you want to leave this community?"
        primaryButton={{
          text: "Leave",
          onPress: handleLeaveCommunity,
          variant: "danger"
        }}
        secondaryButton={{
          text: "Stay",
          onPress: handleCancelLeave
        }}
        onClose={handleCancelLeave}
      />

      {/* Community Invite Modal */}
      {apiCommunity && (
        <CommunityInviteModal
          isVisible={showInviteModal}
          onClose={handleCloseInviteModal}
          communityData={{
            _id: apiCommunity._id,
            name: apiCommunity.name,
            description: apiCommunity.description,
            photoUrl: apiCommunity.photoUrl,
            memberCount: apiCommunity.members?.length || 0,
          }}
        />
      )}

      {/* Full Screen Search Modal */}
      {showFullScreenSearch && (
        <View style={[styles.fullScreenSearchOverlay, { backgroundColor: Colors[theme].background }]}>
          <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
          <SafeAreaView style={[styles.fullScreenSearchContainer, { backgroundColor: Colors[theme].background }]}>
            {/* Search Header */}
            <View style={styles.fullScreenSearchHeader}>
              <TouchableOpacity onPress={handleCloseSearch} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
              </TouchableOpacity>
              <View style={[styles.fullScreenSearchInput, { backgroundColor: Colors[theme].inputBackground }]}>
                <Ionicons name="search" size={20} color={Colors[theme].textLight} />
                <TextInput
                  style={[styles.searchInput, { color: Colors[theme].text }]}
                  placeholder="Search members..."
                  placeholderTextColor={Colors[theme].textLight}
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                  returnKeyType="search"
                  autoFocus={true}
                />
                {memberSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={Colors[theme].textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Results */}
            <FlatList
              data={filteredMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => `search-${item._id}`}
              showsVerticalScrollIndicator={false}
              style={styles.fullScreenSearchResults}
              ListEmptyComponent={() => (
                memberSearchQuery.length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={48} color={Colors[theme].textLight} />
                    <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                      No members found
                    </Typography>
                    <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                      Try a different search term
                    </Typography>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={Colors[theme].textLight} />
                    <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                      Start typing to search members
                    </Typography>
                    <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                      Search by name or username
                    </Typography>
                  </View>
                )
              )}
            />
          </SafeAreaView>
        </View>
      )}

      {/* User Profile Bottom Sheet */}
      {selectedMember && (
        <UserProfileBottomSheet
          isVisible={showUserProfileBottomSheet}
          onClose={() => {
            setShowUserProfileBottomSheet(false);
            setSelectedMember(null);
          }}
          userId={selectedMember._id}
        />
      )}

      {/* Member Action Modal */}
      <MemberActionModal
        isVisible={showMemberActionModal}
        onClose={() => {
          console.log('Closing member action modal');
          setShowMemberActionModal(false);
          setMemberForAction(null);
        }}
        member={memberForAction}
        isOwner={memberForAction?._id === communityData.owner}
        isAdmin={memberForAction ? (communityData.admins && communityData.admins.includes(memberForAction._id)) : false}
        isCurrentUserOwner={isOwner}
        isCurrentUserAdmin={isAdmin}
        onMessageMember={handleMessageMember}
        onViewProfile={handleViewProfile}
        onRemoveMember={hasAdminPrivileges ? handleRemoveMember : undefined}
        onDemoteAdmin={isOwner ? handleDemoteAdmin : undefined}
        onPromoteToAdmin={isOwner ? handlePromoteToAdmin : undefined}
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingHorizontal: 4,
  },
  moreButton: {
    padding: 4,
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
  },
  avatarWrapper: {
    alignItems: 'center',
    paddingTop: 20,
    zIndex: 2,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 20,
    paddingTop: 50,
    paddingHorizontal: 20,
    marginTop: -40,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  nameStyle: {
    marginBottom: 4,
  },
  membersStyle: {
  },
  communityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  communityTypeIcon: {
    marginHorizontal: 4,
  },
  createdByStyle: {
    marginBottom: 12,
  },
  descriptionStyle: {
    marginBottom: 20,
  },
  actionButtonContainer: {
    marginBottom: 10,
  },
  outlineButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    width: "100%",
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  fullPageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 36,
    marginBottom: 16,
  },
  tabsScrollView: {
    flex: 1,
    marginRight: 8,
  },
  tabsContentContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 1,
    borderRadius: 12,
    minWidth: 60,
  },
  activeTab: {
    backgroundColor: Colors.general.primary,
  },
  membersList: {
  },
  membersContent: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberTextInfo: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  adminBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  memberAvatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberNameSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  memberUsernameSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  adminControls: {
    // paddingVertical: 12,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
    justifyContent: 'flex-start',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 100,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    marginRight: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fullScreenSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  fullScreenSearchContainer: {
    flex: 1,
  },
  fullScreenSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
    gap: 12,
  },
  fullScreenSearchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderColor + '40',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  fullScreenSearchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  memberBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicator: {
    marginLeft: 8,
  },
  adminManagementControls: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  adminManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adminManagementActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestsContainer: {
    paddingVertical: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: Colors.general.primary,
  },
  denyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});

export default CommunityInfoScreen;