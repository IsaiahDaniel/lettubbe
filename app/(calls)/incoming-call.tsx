import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, X, Video } from 'lucide-react-native';
import useCallStore from '@/store/callsStore';
import useContactStore from '@/store/contactStore';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { 
    currentCall, 
    answerCall, 
    rejectCall
  } = useCallStore();
  const { getContactById } = useContactStore();
  const { theme } = useCustomTheme();
  
  // Handle case where screen is opened but no incoming call exists
  useEffect(() => {
    if (!currentCall || currentCall.direction !== 'incoming') {
      router.replace('/(calls)');
    }
  }, [currentCall, router]);
  
  if (!currentCall || currentCall.direction !== 'incoming') {
    return null; // Will redirect via useEffect
  }
  
  // Get caller info
  const callerId = currentCall.participants[0]?.contact.id;
  const contact = callerId ? getContactById(callerId) : currentCall.participants[0]?.contact;
  const callerName = contact?.name || 'Unknown Caller';
  const callerAvatar = contact?.avatar;
  const isVideoCall = currentCall.type === 'video';
  
  // Handle accepting the call
  const handleAcceptCall = async () => {
    await answerCall();
    router.replace('/(calls)/ongoing-call');
  };
  
  // Handle rejecting the call
  const handleRejectCall = async () => {
    await rejectCall();
    router.back();
  };
  
  return (
    <LinearGradient
      colors={['#f0d6ff', '#b4e4ff']}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top section with call type and caller info */}
        <View style={styles.topSection}>
          <Typography 
            size={18}
            weight="600"
            color="rgba(255, 255, 255, 0.9)"
            style={styles.callTypeText}
          >
            {isVideoCall ? 'Video Call Incoming' : 'Voice Call Incoming'}
          </Typography>
          
          <View style={styles.callerInfoContainer}>
            <View style={styles.avatarContainer}>
              <Avatar 
                uri={true}
                imageSource={callerAvatar}
                alt={callerName}
                size={120}
                ringColor="white"
                ringThickness={3}
                showRing={true}
              />
            </View>
            
            <Typography
              size={28}
              weight="bold"
              color="white"
              style={styles.callerName}
            >
              {callerName}
            </Typography>
            
            <Typography
              size={16}
              color="rgba(255, 255, 255, 0.8)"
            >
              Calling...
            </Typography>
          </View>
        </View>
        
        {/* Bottom section with call actions */}
        <View style={styles.bottomSection}>
          <View style={styles.actionsRow}>
            {/* Reject Call Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]} 
              onPress={handleRejectCall}
            >
              <X width={28} height={28} color="white" />
            </TouchableOpacity>
            
            {/* Accept Call Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={handleAcceptCall}
            >
              {isVideoCall ? (
                <Video width={28} height={28} color="white" />
              ) : (
                <Phone width={28} height={28} color="white" />
              )}
            </TouchableOpacity>
          </View>
          
          <Typography
            size={14}
            color="rgba(255, 255, 255, 0.7)"
          >
            Swipe up to respond with a message
          </Typography>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  callTypeText: {
    marginBottom: 50,
  },
  callerInfoContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  callerName: {
    marginBottom: 8,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 30,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: Colors.general.error,
  },
  acceptButton: {
    backgroundColor: Colors.general.primary,
  },
});