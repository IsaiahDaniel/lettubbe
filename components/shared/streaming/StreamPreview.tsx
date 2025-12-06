import React from 'react';
import { View, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { UpcomingStream } from '@/helpers/types/streaming/streaming.types';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { formatNumber } from '@/helpers/utils/formatting';

interface StreamPreviewProps {
  streamData: UpcomingStream;
  targetName: string;
  caption: string;
  onCaptionChange: (text: string) => void;
  onSend: () => void;
  onBack: () => void;
}

const StreamPreview: React.FC<StreamPreviewProps> = ({
  streamData,
  targetName,
  caption,
  onCaptionChange,
  onSend,
  onBack,
}) => {
  const { theme } = useCustomTheme();

  const formatStreamDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      if (isThisWeek(date)) return format(date, 'EEEE');
      return format(date, 'MMM dd');
    } catch {
      return 'Scheduled';
    }
  };

  const userInfo = {
    firstName: streamData.user?.user?.firstName || "",
    lastName: streamData.user?.user?.lastName || "",
    profilePicture: streamData.user?.user?.profilePicture || "",
    username: streamData.user?.user?.username || ""
  };

  const formattedTime = (() => {
    const date = formatStreamDate(streamData.startDate);
    const time = streamData.time ? ` • ${streamData.time}` : '';
    return `${date}${time}`;
  })();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors[theme].textBold} />
        </TouchableOpacity>
        <Typography weight="600" size={18} textType="textBold">
          Send to {targetName}
        </Typography>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Stream Card */}
        <View style={styles.streamCard}>
          <View style={styles.cardHeader}>
            <Avatar
              imageSource={{ uri: userInfo.profilePicture }}
              size={32}
              uri
              showRing={false}
              ringColor={streamData.isLive ? Colors.general.live : Colors[theme].avatar}
            />
            <View style={styles.userInfo}>
              <Typography weight="500" size={14} textType="textBold">
                {`${userInfo.firstName} ${userInfo.lastName}`.trim()}
              </Typography>
              <Typography size={12} color={Colors[theme].textLight}>
                @{userInfo.username}
              </Typography>
            </View>
            <View style={streamData.isLive ? styles.liveBadge : styles.scheduledBadge}>
              <Ionicons 
                name={streamData.isLive ? "radio-outline" : "calendar-outline"} 
                size={12} 
                color="white" 
              />
              <Typography size={10} color="white" weight="600">
                {streamData.isLive ? "LIVE" : "SCHEDULED"}
              </Typography>
            </View>
          </View>

          <View style={styles.thumbnailContainer}>
            {streamData.coverPhoto ? (
              <Image 
                source={{ uri: streamData.coverPhoto }} 
                style={styles.thumbnail} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.defaultBackground}>
                <Ionicons name="videocam" size={40} color="white" />
              </View>
            )}
            
            <View style={styles.overlay}>
              <Typography size={12} color="white" weight="500">
                {formatNumber(streamData.views || 0)} viewers
              </Typography>
            </View>
          </View>

          <View style={styles.streamInfo}>
            <Typography size={16} weight="600" style={styles.title} numberOfLines={2}>
              {streamData.title}
            </Typography>
            
            {streamData.description && (
              <Typography size={14} color={Colors[theme].textLight} style={styles.description} numberOfLines={2}>
                {streamData.description}
              </Typography>
            )}
            
            <Typography size={12} color={Colors[theme].textLight} style={styles.time}>
              {formattedTime}
            </Typography>
          </View>
        </View>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={[styles.captionInput, {
              backgroundColor: Colors[theme].inputBackground,
              color: Colors[theme].textBold,
              borderColor: Colors[theme].borderColor,
            }]}
            placeholder="Add a caption..."
            placeholderTextColor={Colors[theme].textLight}
            value={caption}
            onChangeText={onCaptionChange}
            multiline
            maxLength={200}
          />
          <TouchableOpacity style={styles.sendButton} onPress={onSend}>
            <Feather name="send" size={25} color={Colors.general.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  streamCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  defaultBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  streamInfo: {
    gap: 4,
  },
  title: {
    lineHeight: 20,
  },
  description: {
    lineHeight: 18,
  },
  time: {
    marginTop: 4,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  captionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

export default StreamPreview;