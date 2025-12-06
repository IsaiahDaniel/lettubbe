import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface JoinCommunityButtonProps {
  isUserMember: boolean;
  isPublicCommunity: boolean;
  hasPendingRequest: boolean;
  isJoining: boolean;
  onJoinCommunity?: () => void;
}

const JoinCommunityButton: React.FC<JoinCommunityButtonProps> = ({
  isUserMember,
  isPublicCommunity,
  hasPendingRequest,
  isJoining,
  onJoinCommunity,
}) => {
  const { theme } = useCustomTheme();

  if (isUserMember) {
    return null;
  }

  const getButtonText = () => {
    if (hasPendingRequest) return 'Pending Request';
    return isPublicCommunity ? 'Join' : 'Send request';
  };

  const getButtonStyle = () => ({
    backgroundColor: hasPendingRequest
      ? Colors[theme].textLight
      : Colors.general.primary,
    opacity: hasPendingRequest ? 0.6 : 1,
  });

  const getTextColor = () =>
    hasPendingRequest ? Colors[theme].textBold : 'white';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 8,
      }}
    >
      <TouchableOpacity
        style={[
          {
            flex: 1,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 8,
          },
          getButtonStyle(),
        ]}
        onPress={onJoinCommunity}
        activeOpacity={0.8}
        disabled={isJoining || hasPendingRequest}
      >
        <Text
          style={[
            { fontSize: 16, fontWeight: '600' },
            { color: getTextColor() },
          ]}
        >
          {isJoining ? 'Loading...' : getButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default JoinCommunityButton;