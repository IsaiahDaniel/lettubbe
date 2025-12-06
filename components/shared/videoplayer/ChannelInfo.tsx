import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Typography from '@/components/ui/Typography/Typography';
import SubscribeButton from '@/components/shared/profile/SubscribeButton';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface ChannelInfoProps {
  user: {
    _id: string;
    profilePicture?: string;
    firstName?: string;
    lastName?: string;
  };
  subscriberCount: number;
  isSubscribed: boolean;
  showSubscribeButton: boolean;
  onAvatarPress: (userId: string) => void;
  onSubscribe: () => Promise<void>;
  isSubscribing?: boolean;
}

const ChannelInfo: React.FC<ChannelInfoProps> = ({
  user,
  subscriberCount,
  isSubscribed,
  showSubscribeButton,
  onAvatarPress,
  onSubscribe,
  isSubscribing,
}) => {
  const { theme } = useCustomTheme();

  const handleSubscribe = async (userId: string) => {
    await onSubscribe();
  };

  const handleUnsubscribe = async (userId: string) => {
    await onSubscribe();
  };

  return (
    <View style={styles.container}>
      <View style={styles.channelDetails}>
        <TouchableOpacity onPress={() => onAvatarPress(user._id)}>
          <Avatar
            imageSource={user.profilePicture}
            size={50}
            uri
            ringColor={Colors[theme].avatar}
          />
        </TouchableOpacity>
        <View style={styles.textInfo}>
          <Typography 
            style={styles.channelName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.firstName} {user.lastName}
          </Typography>
          <Typography
            style={styles.subscriberCount}
            textType="secondary"
            size={12}
          >
            {subscriberCount} subscribers
          </Typography>
        </View>
      </View>

      {showSubscribeButton && (
        <SubscribeButton
          userId={user._id}
          initialIsSubscribed={isSubscribed}
          subscriberCount={subscriberCount}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
          isLoading={isSubscribing}
          containerStyle={styles.subscribeButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  channelDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  textInfo: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  channelName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscriberCount: {
    marginTop: 2,
  },
  subscribeButton: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    width: 150,
    alignSelf: 'center',
  },
});

export default ChannelInfo;