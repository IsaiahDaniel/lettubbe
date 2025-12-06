import React from "react";
import { View, StyleSheet } from "react-native";
import { useCustomTheme } from "../useCustomTheme";
import { Colors } from "@/constants";
import Avatar from "@/components/ui/Avatar";
import Typography from "@/components/ui/Typography/Typography";

interface CommunityData {
  _id?: string;
  name: string;
  description?: string;
  avatar?: string;
  memberCount?: number;
  isPublic?: boolean;
}

interface UseCommunityHeaderProps {
  isUserMember: boolean;
  name: any;
  loadingUserJoinedCommunities: boolean;
  communityData: CommunityData;
  isJoining: boolean;
  handleInviteMembers: () => void;
  handleCommunityInfo: () => void;
  isSendingRequest?: boolean;
  hasPendingRequest?: boolean;
}

export const useCommunityHeader = ({
  isUserMember,
  name,
  loadingUserJoinedCommunities,
  communityData,
  isJoining,
  handleInviteMembers,
  handleCommunityInfo,
  isSendingRequest = false,
  hasPendingRequest = false,
}: UseCommunityHeaderProps) => {
  const { theme } = useCustomTheme();

  const renderListHeader = () => (
    <View style={styles.profileCardContainer}>
      <View style={styles.avatarWrapper}>
        {communityData.avatar ? (
          <Avatar
            imageSource={{ uri: communityData.avatar }}
            size={100}
            uri
            ringColor={Colors[theme].avatar}
            ringThickness={3}
            showRing={false}
            expandable={true}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { 
                width: 100, 
                height: 100, 
                borderRadius: 50,
                backgroundColor: Colors[theme].cardBackground || "#E5E5E5",
              },
            ]}
          >
            <Typography
              size={40}
              weight="600"
              color={Colors[theme].textLight}
            >
              {communityData.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: Colors[theme].cardBackground },
        ]}
      >
        <Typography size={18} weight="600" style={styles.profileName}>
          {communityData.name || name}
        </Typography>
        <Typography
          weight="500"
          style={styles.subscribers}
          color={Colors[theme].textLight}
        >
          {communityData.memberCount || 0} member
          {(communityData.memberCount || 0) !== 1 ? "s" : ""}
        </Typography>
        <Typography style={styles.bio}>
          {communityData.description}
        </Typography>
      </View>
    </View>
  );

  return { renderListHeader };
};

const styles = StyleSheet.create({
  profileCardContainer: {
    width: "100%",
    paddingTop: 36,
    paddingBottom: 5,
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: "center",
    zIndex: 2,
  },
  profileCard: {
    borderRadius: 20,
    paddingTop: 45,
    paddingHorizontal: 20,
    marginTop: -40,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileName: {
    fontWeight: "600",
    textAlign: "center",
  },
  subscribers: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 6,
  },
  bio: {
    textAlign: "center",
    marginBottom: 18,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default useCommunityHeader;