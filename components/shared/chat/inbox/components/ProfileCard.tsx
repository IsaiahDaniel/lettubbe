import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants/Colors";
import { InboxProfile } from "../types/InboxTypes";
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface ProfileCardProps {
  profile: InboxProfile;
  theme: string;
  onViewProfile: () => void;
  onReport: () => void;
}

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
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: 12,
  },
  bio: {
    textAlign: "center",
    marginBottom: 18,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
    gap: 24,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  profileButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: "#BAD9CC",
  },
  reportButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 40,
    width: 40,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: "#FFF1F0",
  },
});

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onViewProfile,
  onReport
}) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.profileCardContainer}>
      <View style={styles.avatarWrapper}>
        <Avatar
          imageSource={{ uri: profile.avatar }}
          size={100}
          uri
          ringColor={Colors[theme].avatar}
          ringThickness={3}
          showRing={true}
        />
      </View>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: Colors[theme].cardBackground },
        ]}
      >
        <Typography size={24} weight="600" style={styles.profileName}>
          {profile.displayName}
        </Typography>
        <Typography
          weight="500"
          style={styles.subscribers}
          color={Colors[theme].textLight}
        >
          {profile.subscribers} Subscriber
          {profile.subscribers !== "1" ? "s" : ""}
        </Typography>
        <Typography style={styles.bio}>{profile.bio}</Typography>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onViewProfile}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onViewProfile}
            >
              <Ionicons name="person-outline" size={20} color="#6E6E6E" />
            </TouchableOpacity>
            <Typography weight="600" color={Colors[theme].textBold}>
              Profile
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onReport}>
            <TouchableOpacity style={styles.reportButton}>
              <Ionicons name="flag-outline" size={20} color="#F5222D" />
            </TouchableOpacity>
            <Typography weight="600" color="#F5222D">
              Report
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};