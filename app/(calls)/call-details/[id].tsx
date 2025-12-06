import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useCallStore from '@/store/callsStore';
import useContactStore from '@/store/contactStore';
import BackButton from '@/components/utilities/BackButton';
import Avatar from '@/components/ui/Avatar';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import AppButton from '@/components/ui/AppButton';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { CallHistoryItem } from '@/helpers/types/chat/call';

export default function CallDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { callHistory, initiateCall, toggleFavorite, deleteCallHistoryItem } = useCallStore();
  const { getContactById } = useContactStore();
  const [callItem, setCallItem] = useState<CallHistoryItem | null>(null);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const { theme } = useCustomTheme();

  useEffect(() => {
    if (id) {
      const foundCall = callHistory.find(call => call.id === id);
      if (foundCall) {
        setCallItem(foundCall);
      } else {
        // Call not found, go back to calls list
        router.back();
      }
    }
  }, [id, callHistory, router]);

  if (!callItem) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top, backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
        <Typography textType="secondary" size={16} style={styles.loadingText}>
          Loading call details...
        </Typography>
      </View>
    );
  }

  const contact = getContactById(callItem.contactId);
  const contactName = contact?.name || 'Unknown Contact';
  const contactAvatar = contact?.avatar;

  const handleCallBack = async (type: 'audio' | 'video') => {
    if (contact) {
      await initiateCall([contact.id], type);
      router.push('/(calls)/ongoing-call');
    }
    setShowCallOptions(false);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(callItem.id);
  };

  const handleDeleteCall = () => {
    deleteCallHistoryItem(callItem.id);
    router.back();
  };

  const formatCallDate = (timestamp: Date) => {
    return format(new Date(timestamp), 'MMMM d, yyyy');
  };

  const formatCallTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatCallDuration = () => {
    if (!callItem.duration) return 'Call not connected';
    
    const mins = Math.floor(callItem.duration / 60);
    const secs = callItem.duration % 60;
    
    if (mins > 0) {
      return `${mins} min${mins > 1 ? 's' : ''} ${secs} sec${secs !== 1 ? 's' : ''}`;
    } else {
      return `${secs} sec${secs !== 1 ? 's' : ''}`;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: Colors[theme].background }]}>
      <View style={[styles.header, {borderBottomColor: Colors[theme].borderColor}]}>
        <BackButton />
        <Typography textType="textBold" size={18} weight="600">
          Call Details
        </Typography>
        <TouchableOpacity onPress={handleDeleteCall} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={24} color={Colors.general.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.contactInfoContainer, {borderBottomColor: Colors[theme].borderColor}]}>
          <Avatar 
            imageSource={contactAvatar}
            uri={!!contactAvatar}
            alt={contactName}
            size={80}
            fallback={contactName.charAt(0)}
          />
          <Typography textType="textBold" size={24} weight="700" style={styles.contactName}>
            {contactName}
          </Typography>
          <Typography textType="secondary" size={16} style={styles.phoneNumber}>
            {contact?.phoneNumber || ''}
          </Typography>
          
          <View style={[styles.callTypeIndicator, {backgroundColor: Colors[theme].cardBackground}]}>
            {callItem.type === 'video' ? (
              <MaterialIcons name="videocam" size={16} color={callItem.missed ? Colors.general.error : Colors.general.primary} />
            ) : (
              <MaterialIcons name="call" size={16} color={callItem.missed ? Colors.general.error : Colors.general.primary} />
            )}
            <Typography 
              size={14} 
              color={callItem.missed ? Colors.general.error : Colors.general.primary} 
              style={styles.callTypeText}
            >
              {callItem.missed ? 'Missed ' : ''}{callItem.type === 'video' ? 'Video' : 'Audio'} Call
            </Typography>
          </View>
        </View>

        <View style={[styles.detailsContainer, {borderBottomColor: Colors[theme].borderColor}]}>
          <View style={styles.detailRow}>
            <Typography textType="secondary" size={16}>
              Direction
            </Typography>
            <View style={styles.detailValueContainer}>
              {callItem.direction === 'incoming' ? (
                <MaterialCommunityIcons name="call-received" size={16} color={Colors[theme].secondary} style={styles.detailIcon} />
              ) : (
                <MaterialCommunityIcons name="call-made" size={16} color={Colors[theme].secondary} style={styles.detailIcon} />
              )}
              <Typography textType="text" size={16}>
                {callItem.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
              </Typography>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Typography textType="secondary" size={16}>
              Date
            </Typography>
            <Typography textType="text" size={16}>
              {formatCallDate(callItem.timestamp)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Typography textType="secondary" size={16}>
              Time
            </Typography>
            <Typography textType="text" size={16}>
              {formatCallTime(callItem.timestamp)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Typography textType="secondary" size={16}>
              Duration
            </Typography>
            <Typography textType="text" size={16}>
              {formatCallDuration()}
            </Typography>
          </View>

          {callItem.groupCall && (
            <View style={styles.detailRow}>
              <Typography textType="secondary" size={16}>
                Call Type
              </Typography>
              <Typography textType="text" size={16}>
                Group Call
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleToggleFavorite}
          >
            <MaterialIcons 
              name={callItem.favorite ? "star" : "star-outline"} 
              size={24} 
              color={callItem.favorite ? "#FFC107" : Colors[theme].secondary} 
            />
            <Typography textType="text" size={16} style={styles.actionText}>
              {callItem.favorite ? "Remove from Favorites" : "Add to Favorites"}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDeleteCall}
          >
            <MaterialIcons name="delete-outline" size={24} color={Colors.general.error} />
            <Typography textType="text" size={16} style={styles.actionText}>
              Delete
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.callActionContainer, { paddingBottom: insets.bottom || 16, borderTopColor: Colors[theme].borderColor }]}>
        <AppButton 
          title="Call Back" 
          handlePress={() => setShowCallOptions(true)}
          variant="primary"
          height={50}
        />
      </View>

      <CustomBottomSheet
        isVisible={showCallOptions}
        onClose={() => setShowCallOptions(false)}
        title="Choose Call Type"
        showClose={true}
        showCloseIcon={true}
      >
        <View style={styles.callOptionsContainer}>
          <TouchableOpacity 
            style={styles.callOptionButton}
            onPress={() => handleCallBack('audio')}
          >
            <View style={[styles.iconCircle, {backgroundColor: Colors.general.primary}]}>
              <MaterialIcons name="call" size={24} color={Colors.light.background} />
            </View>
            <Typography textType="textBold" size={16} weight="600">
              Audio Call
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.callOptionButton}
            onPress={() => handleCallBack('video')}
          >
            <View style={[styles.iconCircle, {backgroundColor: Colors.general.blue}]}>
              <MaterialIcons name="videocam" size={24} color={Colors.light.background} />
            </View>
            <Typography textType="textBold" size={16} weight="600">
              Video Call
            </Typography>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contactInfoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  contactName: {
    marginTop: 16,
  },
  phoneNumber: {
    marginTop: 4,
  },
  callTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  callTypeText: {
    marginLeft: 8,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 16,
  },
  callActionContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  callOptionsContainer: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40
  },
  callOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});