import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants/Colors";
import BackButton from "@/components/utilities/BackButton";
import Avatar from "@/components/ui/Avatar";
import AppMenu from "@/components/ui/AppMenu";
import { truncateText } from "@/helpers/utils/util";

interface CommunityHeaderProps {
  communityData: {
    name: string;
    avatar?: string;
    memberCount?: number;
  };
  isUserMember: boolean;
  isLoading?: boolean;
  onBack: () => void;
  onCommunityInfo: () => void;
  onMenuSelect: (option: string) => void;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  communityData,
  isUserMember,
  isLoading = false,
  onBack,
  onCommunityInfo,
  onMenuSelect,
}) => {
  const { theme } = useCustomTheme();

  const menuOptions = [
    { name: "Info" },
    ...(isUserMember
      ? [
        { name: "Invite Members" },
        { name: "Leave Community", textStyle: { color: "#FF4444" } }
      ]
      : []),
  ];

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: Colors[theme].borderColor,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <BackButton handlePress={onBack} />
        <TouchableOpacity onPress={onCommunityInfo} style={styles.communityInfo}>
          {isLoading ? (
            // Loading skeleton
            <>
              <View
                style={[
                  styles.skeletonAvatar,
                  { backgroundColor: Colors[theme].borderColor },
                ]}
              />
              <View>
                <View
                  style={[
                    styles.skeletonText,
                    styles.skeletonName,
                    { backgroundColor: Colors[theme].borderColor },
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    styles.skeletonMember,
                    { backgroundColor: Colors[theme].borderColor },
                  ]}
                />
              </View>
            </>
          ) : (
            // Normal content
            <>
              {communityData.avatar ? (
                <Avatar
                  imageSource={{ uri: communityData.avatar }}
                  size={40}
                  uri
                  showRing={false}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { width: 40, height: 40, borderRadius: 20 },
                  ]}
                >
                  <Typography
                    size={16}
                    weight="600"
                    color={Colors[theme].textLight}
                  >
                    {truncateText(communityData.name.charAt(0).toUpperCase(), 17)}
                  </Typography>
                </View>
              )}
              <View>
                <Typography
                  weight="600"
                  size={16}
                  color={Colors[theme].textBold}
                  numberOfLines={1}
                  style={{ maxWidth: 200 }}
                >
                  {communityData.name}
                </Typography>
                <Typography size={12} color={Colors[theme].textLight}>
                  {communityData.memberCount || 0} member
                  {(communityData.memberCount || 0) !== 1 ? "s" : ""}
                </Typography>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.headerRight}>
        <AppMenu
          trigger={(isOpen) => (
            <View style={styles.headerButton}>
              <Ionicons
                name="ellipsis-vertical-outline"
                size={24}
                color={Colors[theme].textBold}
              />
            </View>
          )}
          options={menuOptions}
          selectedOption=""
          onSelect={onMenuSelect}
          width={180}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    flex: 1,
  },
  communityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  avatarPlaceholder: {
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
  },
  skeletonText: {
    borderRadius: 4,
    opacity: 0.3,
  },
  skeletonName: {
    width: 120,
    height: 16,
    marginBottom: 4,
  },
  skeletonMember: {
    width: 80,
    height: 12,
  },
});

export default CommunityHeader;