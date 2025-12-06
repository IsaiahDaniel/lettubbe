import React from "react";
import { View } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import MessageStatus from "@/components/ui/MessageStatus";
import { Colors } from "@/constants/Colors";
import { styles } from "../styles/MessageStyles";
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface TimestampDisplayProps {
  formattedTime: string;
  isUser: boolean;
  theme: string;
  message: any;
  shouldShow: boolean;
}

export const TimestampDisplay: React.FC<TimestampDisplayProps> = ({
  formattedTime,
  isUser,
  message,
  shouldShow
}) => {
  const { theme } = useCustomTheme();

  if (!formattedTime || !shouldShow) return null;

  return (
    <View
      style={[
        styles.timestampContainer,
        isUser
          ? styles.userTimestampContainer
          : styles.otherTimestampContainer,
      ]}
    >
      <Typography
        style={[styles.timestamp, { color: Colors[theme].textLight }]}
        size={11}
      >
        {formattedTime}
      </Typography>
      {isUser && (
        <>
          <Typography
            style={[
              styles.timestampDot,
              { color: Colors[theme].textLight },
            ]}
            size={11}
          >
            •
          </Typography>
          <MessageStatus
            isSent={message.isOptimistic ? (message.isSent || false) : true}
            isRead={message.seen || false}
            size={11}
          />
        </>
      )}
    </View>
  );
};