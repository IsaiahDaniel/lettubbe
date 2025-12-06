import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomTheme } from "../useCustomTheme";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";

interface CommunityData {
  name: string;
  isPublic?: boolean;
}

interface UseCommunityEmptyStateProps {
  communityData: CommunityData;
  isUserMember: boolean;
  name: any;
}

export const useCommunityEmptyState = ({
  communityData,
  isUserMember,
  name,
}: UseCommunityEmptyStateProps) => {
  const { theme } = useCustomTheme();

  const renderEmptyState = () => {
    if (!communityData.isPublic && !isUserMember) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateContent}>
            <Ionicons
              name="lock-closed-outline"
              size={64}
              color={Colors[theme].textLight}
            />
            <Typography
              weight="600"
              size={18}
              color={Colors[theme].textBold}
              style={styles.emptyStateTitle}
            >
              Private Community
            </Typography>
            <Typography
              size={14}
              color={Colors[theme].textLight}
              style={styles.emptyStateSubtitle}
            >
              Join {communityData.name || name} to view and participate in
              conversations
            </Typography>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateContent}>
          <Ionicons
            name="chatbubbles-outline"
            size={64}
            color={Colors[theme].textLight}
          />
          <Typography
            weight="600"
            size={18}
            color={Colors[theme].textBold}
            style={styles.emptyStateTitle}
          >
            Start the Conversation
          </Typography>
          <Typography
            size={14}
            color={Colors[theme].textLight}
            style={styles.emptyStateSubtitle}
          >
            Be the first to send a message in {communityData.name || name}
          </Typography>
        </View>
      </View>
    );
  };

  return { renderEmptyState };
};

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateContent: {
    alignItems: "center",
  },
  emptyStateTitle: {
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default useCommunityEmptyState;