import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, AppState, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useCallStore from '@/store/callsStore';
import usePermissions from '@/hooks/usePermissions';
import { CallType } from '@/helpers/types/chat/call';
import VideoCallView from '@/components/shared/calls/VideoCallView';
import AudioCallView from '@/components/shared/calls/AudioCallView';
import CallControls from '@/components/shared/calls/CallControls';
import CallInfo from '@/components/shared/calls/CallInfo';
import CallOptionsSheet from '@/components/shared/calls/CallOptionsSheet';
import RequestBottomSheet from '@/components/shared/calls/RequestBottomSheet';
import { useCustomTheme } from '@/hooks/useCustomTheme';

export default function OngoingCallScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { requestCameraPermission, requestMicrophonePermission } = usePermissions();
  const appState = useRef(AppState.currentState);

  const { 
    currentCall, 
    localVideoEnabled,
    endCall,
    toggleVideo,
    updateCallStatus
  } = useCallStore();
  
  const [showControls, setShowControls] = useState(true);
  const [isOptionsSheetVisible, setIsOptionsSheetVisible] = useState(false);
  const [isOutgoingRequestPending, setIsOutgoingRequestPending] = useState(false);
  const [showIncomingRequestModal, setShowIncomingRequestModal] = useState(false);
  const [incomingRequestType, setIncomingRequestType] = useState<'video' | 'audio' | null>(null);
  
  // Check permissions when mounting and when call type changes
  useEffect(() => {
    const checkPermissions = async () => {
      if (currentCall?.type === 'video') {
        await requestCameraPermission();
      }
      await requestMicrophonePermission();
    };
    
    if (currentCall) {
      checkPermissions();
    }
  }, [currentCall?.type]);
  
  // Control visibility based on activity
  useEffect(() => {
    if (currentCall?.type === 'video') {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showControls, currentCall?.type]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        currentCall?.type === 'video'
      ) {
        // App is coming back to foreground, reset video if needed
        if (localVideoEnabled) {
          // Briefly toggle video off and on to restart camera
          toggleVideo();
          setTimeout(() => toggleVideo(), 500);
        }
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [currentCall, localVideoEnabled]);
  
  // Handle tap to show controls
  const handleScreenTap = () => {
    if (currentCall?.type === 'video') {
      setShowControls(true);
    }
  };
  
  // Handle call end and navigation
  const handleEndCall = async () => {
    await endCall();
    router.back();
  };
  
  // Bottom sheet handlers
  const handleMorePress = () => {
    setIsOptionsSheetVisible(true);
  };
  
  const handleSendMessage = () => {
    const contactId = currentCall?.participants[0]?.contact.id;
    if (contactId) {
      endCall();
      router.push(`/(chat)/${contactId}` as any);
    }
    setIsOptionsSheetVisible(false);
  };
  
  // Request permission to switch to video
  const handleRequestVideoSwitch = () => {
    // Simulate request flow
    setIsOutgoingRequestPending(true);
    setIsOptionsSheetVisible(false);
    
    // Simulate receiving a response after some time
    setTimeout(() => {
      setIsOutgoingRequestPending(false);
      handleVideoSwitchAccepted();
    }, 2000);
  };
  
  // Handle switch to audio call
  const handleRequestAudioSwitch = () => {
    if (currentCall) {
      // Update call type
      const updatedCall = {
        ...currentCall,
        type: 'audio' as CallType
      };
      updateCallStatus('connected', updatedCall);
      
      // Turn off video
      if (localVideoEnabled) {
        toggleVideo();
      }
    }
    setIsOptionsSheetVisible(false);
  };
  
  // Handle video switch accepted
  const handleVideoSwitchAccepted = async () => {
    // Check camera permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }
    
    if (currentCall) {
      // Update call type
      const updatedCall = {
        ...currentCall,
        type: 'video' as CallType
      };
      updateCallStatus('connected', updatedCall);
      
      // Enable video
      if (!localVideoEnabled) {
        toggleVideo();
      }
    }
  };
  
  // Handle incoming request responses
  const handleAcceptIncomingRequest = () => {
    setShowIncomingRequestModal(false);
    if (incomingRequestType === 'video') {
      handleVideoSwitchAccepted();
    } else if (incomingRequestType === 'audio') {
      handleRequestAudioSwitch();
    }
    setIncomingRequestType(null);
  };
  
  const handleRejectIncomingRequest = () => {
    setShowIncomingRequestModal(false);
    setIncomingRequestType(null);
  };
  
  const handleAddParticipant = () => {
    // Implementation for adding participants
    setIsOptionsSheetVisible(false);
  };
  
  // Return to home if no active call
  useEffect(() => {
    if (!currentCall) {
      router.replace('/(calls)');
    }
  }, [currentCall, router]);
  
  if (!currentCall) {
    return null; // Will redirect via useEffect
  }
  
  // Get the remote participant (first non-local participant)
  const remoteParticipant = currentCall.participants.find(p => !p.isLocal) || currentCall.participants[0];
  const localParticipant = currentCall.participants.find(p => p.isLocal) || currentCall.participants[0];
  
  const isVideoCall = currentCall.type === 'video';
  const isCallConnected = currentCall.status === 'connected';
  const callStatusText = isCallConnected ? null : (
    currentCall.status === 'connecting' ? 'Connecting...' : 
    currentCall.status === 'ringing' ? 'Ringing...' : 
    'Not available'
  );
  
  // Get avatar for remote participant
  const getAvatarPath = () => {
    if (remoteParticipant.contact.id === 'me') {
      return 'lego/1';
    }
    
    // Check if the ID can be converted to a number
    const numericId = parseInt(remoteParticipant.contact.id, 10);
    if (!isNaN(numericId)) {
      // Now use the modulo operator
      return `${numericId % 2 === 0 ? 'men' : 'women'}/${numericId}`;
    }
    
    // Fallback for non-numeric IDs
    return 'lego/2';
  };
  
  const avatarUrl = `https://randomuser.me/api/portraits/${getAvatarPath()}.jpg`;
  
  return (
    <TouchableOpacity 
      activeOpacity={1} 
      style={styles.container} 
      onPress={handleScreenTap}
    >
      {isVideoCall ? (
        <VideoCallView 
          remoteParticipant={remoteParticipant}
          localParticipant={localParticipant}
          localVideoEnabled={localVideoEnabled}
          showControls={showControls}
        />
      ) : (
        <AudioCallView remoteParticipant={remoteParticipant} />
      )}
      
      {/* Call info and controls */}
      {(showControls || !isVideoCall) && (
        <SafeAreaView style={styles.controlsContainer} edges={['top', 'bottom']}>
          <View style={styles.callInfoContainer}>
            <Text style={styles.callerName}>
              {remoteParticipant.contact.name}
            </Text>
            
            <CallInfo 
              remoteParticipant={remoteParticipant}
              callStatusText={callStatusText}
              callStartTime={currentCall.startTime ? currentCall.startTime.getTime() : 0}
            />
          </View>
          
          <CallControls 
            isVideoCall={isVideoCall}
            onEndCall={handleEndCall}
            onMorePress={handleMorePress}
          />
        </SafeAreaView>
      )}
      
      {/* Bottom Sheets */}
      <CallOptionsSheet
        isVisible={isOptionsSheetVisible}
        onClose={() => setIsOptionsSheetVisible(false)}
        onSendMessage={handleSendMessage}
        onSwitchToVideo={handleRequestVideoSwitch}
        onSwitchToAudio={handleRequestAudioSwitch}
        onAddParticipant={handleAddParticipant}
        isVideoCall={isVideoCall}
        isCallConnected={isCallConnected}
      />
      
      <RequestBottomSheet
        type="outgoing"
        isVisible={isOutgoingRequestPending}
        requestType="video"
        onClose={() => setIsOutgoingRequestPending(false)}
      />
      
      <RequestBottomSheet
        type="incoming"
        isVisible={showIncomingRequestModal}
        requestType={incomingRequestType}
        participantName={remoteParticipant?.contact.name}
        onAccept={handleAcceptIncomingRequest}
        onReject={handleRejectIncomingRequest} 
        onClose={() => setShowIncomingRequestModal(false)}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 3,
  },
  callInfoContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  callerName: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  }
});