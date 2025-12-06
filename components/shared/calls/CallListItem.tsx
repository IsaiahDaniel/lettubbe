import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CallHistoryItem } from '@/helpers/types/chat/call';
import { format } from 'date-fns';
import useContactStore from '@/store/contactStore';
import useCallStore from '@/store/callsStore';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface CallListItemProps {
  callItem: CallHistoryItem;
}

const CallListItem: React.FC<CallListItemProps> = ({ callItem }) => {
  const router = useRouter();
  const { getContactById } = useContactStore();
  const { initiateCall } = useCallStore();
  const { theme } = useCustomTheme();
  
  const contact = getContactById(callItem.contactId);
  const contactName = contact?.name || 'Unknown Contact';
  const contactAvatar = contact?.avatar;
  
  const handleCallPress = async (event: { stopPropagation: () => void; }) => {
    // Prevent the parent touchable from being triggered
    event.stopPropagation();
    
    if (contact) {
      await initiateCall([contact.id], callItem.type);
      router.push('/(calls)/ongoing-call');
    }
  };

  const handleItemPress = () => {
    // Navigate to call details page
    router.push(`/(calls)/call-details/${callItem.id}`);
  };
  
  const getCallTypeIcon = () => {
    const iconSize = 16;
    const iconColor = callItem.missed ? Colors.general.error : Colors.general.primary;
    
    if (callItem.type === 'video') {
      return <MaterialIcons name="videocam" size={iconSize} color={iconColor} />;
    } else {
      return <MaterialIcons name="call" size={iconSize} color={iconColor} />;
    }
  };
  
  const getCallDirectionIcon = () => {
    if (callItem.missed) {
      return null; // No direction icon for missed calls
    }
    
    const iconSize = 14;
    const iconColor = Colors[theme].secondary;
    
    if (callItem.direction === 'incoming') {
      return <MaterialCommunityIcons name="call-received" size={iconSize} color={iconColor} />;
    } else {
      return <MaterialCommunityIcons name="call-made" size={iconSize} color={iconColor} />;
    }
  };
  
  const formatCallTime = () => {
    if (!callItem.timestamp) return '';
    return format(callItem.timestamp, 'h:mm a');
  };
  
  const formatCallDuration = () => {
    if (!callItem.duration) return '';
    
    const mins = Math.floor(callItem.duration / 60);
    const secs = callItem.duration % 60;
    
    if (mins > 0) {
      return `${mins} min${mins > 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
    } else {
      return `${secs} sec${secs !== 1 ? 's' : ''}`;
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleItemPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar 
          imageSource={contactAvatar}
          uri={!!contactAvatar}
          alt={contactName}
          size={48}
          fallback={contactName.charAt(0)}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Typography 
            weight="500"
            size={16}
            numberOfLines={1}
            color={callItem.missed ? Colors.general.error : undefined}
            textType="textBold"
          >
            {callItem.groupCall ? `${contactName} + others` : contactName}
          </Typography>
          {callItem.favorite && (
            <MaterialIcons name="star" size={16} color="#FFC107" style={styles.favoriteIcon} />
          )}
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.callDetails}>
            {getCallDirectionIcon()}
            <Typography 
              size={14}
              textType="secondary"
              style={styles.detailText}
            >
              {callItem.missed 
                ? 'Missed' 
                : (callItem.duration 
                  ? formatCallDuration() 
                  : 'Call not connected')}
            </Typography>
          </View>
          
          <Typography 
            size={13}
            textType="secondary"
          >
            {formatCallTime()}
          </Typography>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.callButton}
        onPress={handleCallPress}
      >
        {getCallTypeIcon()}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteIcon: {
    marginLeft: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
  },
  callButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallListItem;