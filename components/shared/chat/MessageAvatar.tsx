import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import Avatar from "@/components/ui/Avatar";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { MessageUser } from "@/helpers/types/chat/message.types";
import { extractUserId, getUserProfilePicture, extractUsername } from "@/helpers/utils/messageUtils";

interface MessageAvatarProps {
  user: string | MessageUser;
  size?: number;
  onPress?: () => void;
  disabled?: boolean;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({
  user,
  size = 32,
  onPress,
  disabled = false
}) => {
  const { theme } = useCustomTheme();
  const profilePicture = getUserProfilePicture(user);
  const username = extractUsername(user);

  if (profilePicture) {
    return (
      <TouchableOpacity
        style={[styles.container, { width: size, height: size }]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled || !onPress}
      >
        <Avatar
          imageSource={{ uri: profilePicture }}
          size={size}
          uri
          showRing={false}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || !onPress}
    >
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors[theme].cardBackground || "#E5E5E5",
          }
        ]}
      >
        <Typography
          size={size * 0.375}
          weight="600"
          color={Colors[theme].textLight}
        >
          {username.charAt(0).toUpperCase()}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    marginLeft: -8,
    alignSelf: "flex-end",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessageAvatar;