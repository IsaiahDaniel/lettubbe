import React from "react";
import { View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface MessageTimestampProps {
  show: boolean;
  time: string;
  isOwnMessage: boolean;
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  show,
  time,
  isOwnMessage,
}) => {
  const { theme } = useCustomTheme();

  if (!show) return null;

  return (
    <View
      style={[
        styles.timestampContainer,
        isOwnMessage ? styles.userTimestampContainer : styles.otherTimestampContainer,
      ]}
    >
      <Typography
        style={[styles.timestamp, { color: Colors[theme].textLight }]}
        size={11}
      >
        {time}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginHorizontal: 4,
    gap: 2,
  },
  userTimestampContainer: {
    justifyContent: "flex-end",
  },
  otherTimestampContainer: {
    justifyContent: "flex-start",
  },
  timestamp: {
    fontSize: 11,
  },
});

export default MessageTimestamp;