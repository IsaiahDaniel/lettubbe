import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import Avatar from "@/components/ui/Avatar";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useJoinCommunity } from "@/hooks/community/useJoinCommunity";
import { useLeaveCommunity } from "@/hooks/community/useLeaveCommunity";
import { useCheckPendingJoinRequest } from "@/hooks/community/useCheckPendingJoinRequest";
import { useSendJoinRequest } from "@/hooks/community/useSendJoinRequest";
import { useCommunityStore } from "@/store/communityStore";
import useAuth from "@/hooks/auth/useAuth";
import { useAlert } from "@/components/ui/AlertProvider";
import Toast from "react-native-toast-message";
import useGetPublicProfile from "@/hooks/profile/useGetPublicProfile";

interface Community {
  _id: string;
  name: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  description?: string;
  topics?: string[];
  categories?: string[];
  type: "public" | "private";
  date: string;
  isSetupComplete: boolean;
  members: string[];
  approvals?: string[];
  subAdmins?: string[];
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  coverPhoto?: string;
  isJoined?: boolean;
  membersWithProfiles?: Array<{
    _id: string;
    username: string;
    profilePicture?: string;
  }>;
}

interface CommunityListVerticalProps {
  communities: Community[];
  onCommunityPress?: (community: Community) => void;
}

interface CommunityListItemProps {
  community: Community;
  onPress?: (community: Community) => void;
}

// Member Avatar Component
interface MemberAvatarProps {
  memberId: string;
  index: number;
  isJoined?: boolean;
  memberData?: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
}

const MemberAvatar: React.FC<MemberAvatarProps> = React.memo(({ memberId, index, isJoined, memberData }) => {
  const { theme } = useCustomTheme();
  
  // Only fetch profile if we don't have complete member data AND we actually need it
  const needsProfileFetch = !memberData?.profilePicture && memberId;
  const { data: profileData } = useGetPublicProfile(needsProfileFetch ? memberId : '');

  // Use memberData if available, otherwise fall back to profileData
  const profilePicture = memberData?.profilePicture || profileData?.profilePicture;
  const username = memberData?.username || profileData?.username;

  const handleMemberPress = () => {
    if (memberId) {
      router.push(`/(profile)/${memberId}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleMemberPress}
      activeOpacity={0.7}
      disabled={!memberId}
      style={[
        styles.memberAvatar,
        {
          marginLeft: index === 0 ? 0 : -8, // Overlapping effect
          zIndex: 4 - index // Stacking order
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
          <Typography size={8} weight="600" color="#666">
            {username?.charAt(0).toUpperCase() || 'U'}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Member Avatars Container Component
interface MemberAvatarsProps {
  memberIds: string[];
  memberCount: number;
  isJoined?: boolean;
  membersWithProfiles?: Array<{
    _id: string;
    username: string;
    profilePicture?: string;
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

const CommunityListItem: React.FC<CommunityListItemProps> = React.memo(({ community, onPress }) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { join, isLoading: isJoining } = useJoinCommunity();
  const sendJoinRequestMutation = useSendJoinRequest();
  const { hasPendingRequest } = useCheckPendingJoinRequest(community);
  const { isPendingCommunity, addPendingCommunity, removePendingCommunity } = useCommunityStore();
  const { showConfirm } = useAlert();
  const [isProcessing, setIsProcessing] = useState(false);

  const isCurrentUserMember = community.members?.includes(userDetails?._id || '');
  const hasLocalPendingRequest = isPendingCommunity(community._id);
  const showPending = hasPendingRequest || hasLocalPendingRequest;

  const handlePress = () => {
    if (onPress) {
      onPress(community);
    } else {
      router.push(`/(community)/${community._id}`);
    }
  };

  const handleJoinPress = async (e: any) => {
    e.stopPropagation();
    
    if (!userDetails?._id) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to join communities',
      });
      return;
    }

    if (!isCurrentUserMember) {
      // Handle join community
      setIsProcessing(true);
      try {
        if (community.type === 'private') {
          // For private communities, send join request
          addPendingCommunity(community._id);
          await sendJoinRequestMutation.mutateAsync(community._id);
        } else {
          // Public community - join directly
          await join(community._id);
          Toast.show({
            type: 'success',
            text1: 'Joined Community',
            text2: `You have joined ${community.name}`,
          });
        }
      } catch (error) {
        console.error('Failed to join community:', error);
        if (community.type === 'private') {
          removePendingCommunity(community._id);
        }
        Toast.show({
          type: 'error',
          text1: 'Failed to Join',
          text2: 'Unable to join community. Please try again.',
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getJoinButtonText = () => {
    if (showPending) return "Pending";
    if (community.type === 'private') return "Request";
    return "Join";
  };

  const getJoinButtonStyle = () => {
    if (showPending) {
      return { backgroundColor: Colors[theme].borderColor };
    }
    return { backgroundColor: Colors.general.primary };
  };

  const getJoinButtonTextColor = () => {
    if (showPending) {
      return Colors[theme].textBold;
    }
    return "#fff";
  };

  const profilePictureUri = community.profilePicture;

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        { 
          backgroundColor: Colors[theme].sheetBackground,
          borderBottomColor: Colors[theme].borderColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <Avatar
        imageSource={profilePictureUri}
        size={50}
        uri={!!profilePictureUri}
        ringColor={Colors[theme].avatar}
        ringThickness={2}
        gapSize={1}
        showRing={true}
        alt={community.name}
      />

      {/* Community Info */}
      <View style={styles.communityInfo}>
        <View style={styles.nameContainer}>
          <Typography
            textType="textBold"
            size={16}
            numberOfLines={1}
            style={styles.communityName}
          >
            {community.name}
          </Typography>
          
          {/* Private community indicator */}
          {community.type === "private" && (
            <Ionicons 
              name="lock-closed" 
              size={14} 
              color={Colors[theme].textLight} 
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Owner */}
        <Typography
          size={14}
          color={Colors[theme].textLight}
          numberOfLines={1}
          style={styles.owner}
        >
          by @{community.owner.username}
        </Typography>

        {/* Description */}
        {community.description && (
          <Typography
            size={13}
            color={Colors[theme].textLight}
            numberOfLines={2}
            style={styles.description}
          >
            {community.description}
          </Typography>
        )}

        {/* Member Avatars */}
        {community.members && community.members.length > 0 && (
          <MemberAvatars
            memberIds={community.members}
            memberCount={community.members.length}
            isJoined={community.isJoined}
            membersWithProfiles={community.membersWithProfiles}
          />
        )}
      </View>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        {!isCurrentUserMember && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              getJoinButtonStyle()
            ]}
            onPress={handleJoinPress}
            disabled={isProcessing || isJoining || sendJoinRequestMutation.isPending}
          >
            {(isProcessing || isJoining || sendJoinRequestMutation.isPending) ? (
              <ActivityIndicator size="small" color={getJoinButtonTextColor()} />
            ) : (
              <Typography
                size={12}
                weight="600"
                color={getJoinButtonTextColor()}
              >
                {getJoinButtonText()}
              </Typography>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

const CommunityListVertical: React.FC<CommunityListVerticalProps> = ({
  communities,
  onCommunityPress,
}) => {
  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {communities.map((community) => (
        <CommunityListItem
          key={community._id}
          community={community}
          onPress={onCommunityPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  communityName: {
    flex: 1,
  },
  lockIcon: {
    marginLeft: 4,
  },
  owner: {
    marginBottom: 4,
  },
  description: {
    lineHeight: 16,
    marginBottom: 4,
  },
  memberCount: {
    fontWeight: "500",
  },
  buttonContainer: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
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
  memberCountText: {
    marginLeft: 8,
    fontWeight: "500",
  },
});

export default CommunityListVertical;