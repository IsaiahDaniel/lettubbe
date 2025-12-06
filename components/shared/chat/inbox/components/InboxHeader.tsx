import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { InboxProfile } from "../types/InboxTypes";
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface InboxHeaderProps {
  profile: InboxProfile;
  userOnlineStatus: string;
  theme: string;
  onGoBack: () => void;
  onViewProfile: () => void;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    maxWidth: 200,
  },
  status: {
    fontSize: 12,
    color: "#4CAF50",
  },
});

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  profile,
  userOnlineStatus,
  onGoBack,
  onViewProfile
}) => {
  const { theme } = useCustomTheme();

  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: Colors[theme].borderColor },
      ]}
    >
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={Colors[theme].text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.userInfo} onPress={onViewProfile}>
        <Text
          style={[styles.username, { color: Colors[theme].textBold }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {profile.displayName}
        </Text>
        <Text style={[
          styles.status, 
          { color: userOnlineStatus === 'online' ? '#4CAF50' : Colors[theme].textLight }
        ]}>
          {userOnlineStatus}
        </Text>
      </TouchableOpacity>
    </View>
  );
};