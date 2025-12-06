import React from "react";
import { View, StyleSheet } from "react-native";
import AppButton from "@/components/ui/AppButton";
import { Icons } from "@/constants";

interface ProfileActionButtonsProps {
  isLoadingProfile: boolean;
  onChatPress: () => void;
  theme: string;
}

const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  isLoadingProfile,
  onChatPress,
  theme,
}) => {
  return (
    <View style={styles.container}>
      {isLoadingProfile ? (
        <View style={[styles.skeletonButton, { width: 107, height: 32, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
      ) : (
        <AppButton
          title="Message"
          variant="profile"
          handlePress={onChatPress}
          icon={Icons.message}
          style={styles.messageButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageButton: {
    width: 107,
    alignSelf: 'flex-start',
    marginHorizontal: 0,
  },
  skeletonButton: {
    borderRadius: 8,
    opacity: 0.6,
  },
});

export default ProfileActionButtons;