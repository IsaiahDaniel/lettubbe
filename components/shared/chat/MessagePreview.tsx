import React from 'react';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { truncateText } from '@/helpers/utils/util';

interface MessagePreviewProps {
  messageText: string;
  isUnread: boolean;
  theme: 'light' | 'dark';
  maxLength?: number;
}

const MessagePreview = ({ 
  messageText, 
  isUnread, 
  theme, 
  maxLength = 40 
}: MessagePreviewProps) => {
  const safeMessageText = messageText || '';

  return (
    <Typography
      numberOfLines={1}
      size={14}
      color={isUnread ? Colors[theme].textBold : Colors[theme].textLight}
      weight={isUnread ? "500" : "400"}
    >
      {truncateText(safeMessageText, maxLength)}
    </Typography>
  );
};

export default MessagePreview;