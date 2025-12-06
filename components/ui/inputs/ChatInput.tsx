import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import { useChatInputState } from '@/hooks/chats/useChatInputState';
import { useVoiceRecorder } from '@/hooks/chats/useVoiceRecorder';
import useVideoUploadStore from '@/store/videoUploadStore';
import FilePickerBottomSheet from '@/components/shared/chat/fileSharing/FilePickerBottomSheet';
import JoinCommunityButton from '@/components/shared/chat/JoinCommunityButton';
import InputField from '@/components/shared/chat/chatInput/InputField';
import SendButton from '@/components/shared/chat/chatInput/SendButton';
import ReplyPreview from '@/components/shared/chat/inbox/components/ReplyPreview';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendVoiceNote?: (audioUri: string, duration: number, replyMessage?: any) => void;
  message: string;
  setMessage: (message: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  otherUserTyping?: boolean;
  otherUserName?: string;
  isUserMember?: boolean;
  isPublicCommunity?: boolean;
  onJoinCommunity?: () => void;
  isJoining?: boolean;
  hasPendingRequest?: boolean;
  togglePicker?: () => void;
  isPickerOpen?: boolean;
  uploadedImages?: string[];
  onRemoveImage?: (image: string, type: string) => void;
  onRemoveVideo?: (video: string, type: string) => void;
  uploadedVideo?: string[];
  videoDetails?: { name?: string };
  conversationId?: string | null;
  communityId?: string | null;
  isUploadingAudio?: boolean;
  onPickerToggle?: () => void;
  replyMessage?: any;
  onClearReply?: () => void;
  chatFunctions?: {
    setUploadedImageUrls?: (urls: string[]) => void;
    setUploadedVideoUrls?: (urls: string[]) => void;
    setChatMessage?: (message: string) => void;
    handleSendChat?: () => void;
    sendMediaMessage?: (caption: string, mediaAssets: any[], replyMessage?: any) => void;
    closeModal?: () => void;
  };
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onSendVoiceNote,
  setMessage,
  message,
  onTypingStart,
  onTypingStop,
  otherUserTyping,
  otherUserName,
  isUserMember = true,
  isPublicCommunity = true,
  onJoinCommunity,
  isJoining = false,
  hasPendingRequest = false,
  togglePicker,
  isPickerOpen,
  uploadedImages = [],
  onRemoveImage,
  onRemoveVideo,
  uploadedVideo = [],
  videoDetails,
  conversationId,
  communityId,
  isUploadingAudio = false,
  onPickerToggle,
  replyMessage,
  onClearReply,
  chatFunctions,
}) => {
  const { theme } = useCustomTheme();
  const [selectedPickerType, setSelectedPickerType] = useState<
    'images' | 'videos' | 'documents' | 'audio' | null
  >(null);

  const { setisCommunityUpload, setIsChatUpload, isChatUpload } = useVideoUploadStore();

  const {
    isFocused,
    inputRef,
    handleFocus,
    handleBlur,
    handleTypingStart,
    handleTypingStop,
    setTypingTimeout,
  } = useChatInputState({ onTypingStart, onTypingStop });

  // Voice recording functionality
  const voiceRecorder = useVoiceRecorder();


  const handleSend = () => {
    const hasText = message.trim().length > 0;
    const hasMedia = uploadedImages?.length > 0 || uploadedVideo?.length > 0;

    if (!hasText && !hasMedia) return;

    handleTypingStop();
    onSend(message);
    setMessage('');
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    handleTypingStart(text);
    setTypingTimeout(text);
  };

  const canSend = message.trim().length > 0 || uploadedImages?.length > 0 || uploadedVideo?.length > 0;

  const closeModal = () => {
    setSelectedPickerType(null);
    togglePicker?.();
  };

  const handlePickerSelect = (type?: string) => {
    if (type) {
      if (isChatUpload) {
        setIsChatUpload(true);
      } else {
        setisCommunityUpload(true);
      }
      setSelectedPickerType(type as 'images' | 'videos' | 'documents' | 'audio');
    } else {
      setSelectedPickerType(null);
      togglePicker?.();
    }
  };

  // Voice recording handlers
  const handleVoiceRecordToggle = async () => {
    if (voiceRecorder.state.isRecording) {
      // Stop recording - don't auto-send, wait for user to choose
      await voiceRecorder.stopRecording();
    } else {
      // Start recording
      await voiceRecorder.startRecording();
    }
  };

  const handleVoiceCancel = () => {
    voiceRecorder.cancelRecording();
  };

  const [isSendingVoice, setIsSendingVoice] = useState(false);

  const handleVoiceSend = async () => {
    console.log('🎵 [VOICE_SEND] Starting voice send process', {
      isRecording: voiceRecorder.state.isRecording,
      audioUri: voiceRecorder.state.audioUri,
      duration: voiceRecorder.state.duration
    });

    setIsSendingVoice(true);
    
    try {
      let audioUri: string | null = null;

      if (voiceRecorder.state.isRecording) {
        console.log('🎵 [VOICE_SEND] Stopping recording first');
        await voiceRecorder.stopRecording();
        audioUri = await voiceRecorder.sendVoiceNote();
      } else {
        console.log('🎵 [VOICE_SEND] Getting existing voice note URI');
        audioUri = await voiceRecorder.sendVoiceNote();
      }
      
      console.log('🎵 [VOICE_SEND] Voice note URI:', audioUri);
    
      if (audioUri && onSendVoiceNote) {
        console.log('🎵 [VOICE_SEND] Calling onSendVoiceNote');
        onSendVoiceNote(audioUri, voiceRecorder.state.duration, replyMessage);
      } else {
        console.log('🎵 [VOICE_SEND] Missing audioUri or onSendVoiceNote callback');
      }
    } catch (error) {
      console.error('🎵 [VOICE_SEND] Error in voice send process:', error);
      // Reset recorder state on error
      voiceRecorder.cancelRecording();
    } finally {
      setIsSendingVoice(false);
    }
  };

  // Animation values
  const animationProgress = useSharedValue(0);

  // Update animation when focus state or recording state changes
  useEffect(() => {
    const shouldExpand = isFocused || voiceRecorder.state.isRecording || !!voiceRecorder.state.audioUri;
    animationProgress.value = withSpring(shouldExpand ? 1 : 0, {
      duration: 300,
      dampingRatio: 0.8,
      stiffness: 120,
    });
  }, [isFocused, voiceRecorder.state.isRecording, voiceRecorder.state.audioUri]);

  // Animated styles for morphing layout
  const containerStyle = useAnimatedStyle(() => {
    return {
      paddingHorizontal: 4,
      marginBottom: 4,
    };
  });

  // Paperclip button animation (left side -> bottom left)
  const paperclipStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 0], // Stay in same X position (left side)
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 45],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
      position: 'absolute',
      left: 8,
      top: 7.5, 
      zIndex: 2,
    };
  });

  // Send button animation (right side -> bottom right)
  const sendButtonStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 0], // Stay in same X position (right side)
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 45],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
      position: 'absolute',
      right: 3, 
      top: 9,
      zIndex: 2,
    };
  });

  // Unified container background animation
  const unifiedContainerStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      animationProgress.value,
      [0, 1],
      [120, 26], // Slightly larger radius when expanded
      Extrapolation.CLAMP
    );
    
    return {
      backgroundColor: Colors[theme].cardBackground,
      borderRadius,
      borderWidth: interpolate(
        animationProgress.value,
        [0, 1],
        [0, 1],
        Extrapolation.CLAMP
      ),
      borderColor: Colors[theme].borderColor,
      overflow: 'hidden',
    };
  });

  // Input field container animation - expands to full width when focused or recording
  const inputContainerStyle = useAnimatedStyle(() => {
    const position = animationProgress.value > 0.5 ? 'absolute' : 'relative';
    const left = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 8], // Start from container edge when expanded
      Extrapolation.CLAMP
    );
    const right = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 8], // End at container edge when expanded
      Extrapolation.CLAMP
    );
    const top = interpolate(
      animationProgress.value,
      [0, 1],
      [0, 4], // Align with top section
      Extrapolation.CLAMP
    );
    
    return {
      position: position as any,
      left,
      right,
      top,
      zIndex: 1, // Above buttons when expanded
    };
  });

  // Input field style
  const inputFieldStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationProgress.value,
      [0, 1],
      [45, 40], // Slightly shorter when expanded since it's multiline
      Extrapolation.CLAMP
    );
    
    return {
      height,
      paddingHorizontal: 8,
      justifyContent: 'center',
    };
  });

  // Separator line animation (appears when focused)
  const separatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.3, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );
    
    return {
      opacity,
      height: 1,
      backgroundColor: Colors[theme].borderColor,
      marginHorizontal: 100,
    };
  });


  // Main container height animation
  const mainContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animationProgress.value,
      [0, 1],
      [53, 100],
      Extrapolation.CLAMP
    );

    return {
      height,
      overflow: 'visible', // Allow buttons to be visible when they move down
      marginBottom: 8,
      marginHorizontal: 4,
    };
  });

  // Debug logging for typing indicator
  React.useEffect(() => {
    console.log("⌨️ [CHAT_INPUT] Typing state updated:", {
      otherUserTyping,
      shouldShowIndicator: !!otherUserTyping
    });
  }, [otherUserTyping]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{
        width: '100%',
        borderTopWidth: 1,
        paddingTop: 8,
        borderTopColor: Colors[theme].borderColor,
      }}
    >
      {/* Reply Preview */}
      {replyMessage && onClearReply && (
        <ReplyPreview
          replyToMessage={replyMessage}
          onClose={onClearReply}
        />
      )}
      
      {/* Typing Indicator */}
      {otherUserTyping && (
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginHorizontal: 8,
          marginBottom: 8,
          borderRadius: 16,
          // backgroundColor: Colors[theme].cardBackground,
        }}>
          <Typography style={{ 
            fontStyle: 'italic', 
            color: Colors[theme].textLight,
            fontSize: 14
          }}>
            {otherUserName || 'Someone'} is typing...
          </Typography>
        </View>
      )}

      <JoinCommunityButton
        isUserMember={isUserMember}
        isPublicCommunity={isPublicCommunity}
        hasPendingRequest={hasPendingRequest}
        isJoining={isJoining}
        onJoinCommunity={onJoinCommunity}
      />

      {isUserMember && (
        <Animated.View style={[containerStyle, mainContainerStyle]}>
          {/* Unified background container */}
          <Animated.View style={[unifiedContainerStyle, { position: 'relative', height: '100%' }]}>
            
            {/* Top section - input field container */}
            <View style={{
              height: 53, // Fixed height for top row
              paddingHorizontal: 8,
              paddingVertical: 4,
              position: 'relative',
            }}>
              {/* Input field - expands to full width when focused */}
              <Animated.View style={[{ flex: 1 }, inputContainerStyle]}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (!voiceRecorder.state.isRecording && !voiceRecorder.state.audioUri) {
                      inputRef.current?.focus();
                    }
                  }}
                  activeOpacity={0.9}
                  disabled={isFocused || voiceRecorder.state.isRecording || !!voiceRecorder.state.audioUri}
                >
                  <Animated.View style={[inputFieldStyle, { flex: 1 }]}>
                    {(voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) ? (
                      <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {voiceRecorder.state.isRecording ? (
                          <>
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#ff4444',
                            }} />
                            <Typography style={{
                              fontSize: 14,
                              color: Colors[theme].text,
                              fontWeight: '500',
                            }}>
                              Recording... {Math.floor(voiceRecorder.state.duration / 60)}:{(Math.floor(voiceRecorder.state.duration % 60)).toString().padStart(2, '0')}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Feather name="mic" size={16} color={Colors[theme].text} />
                            <Typography style={{
                              fontSize: 14,
                              color: Colors[theme].text,
                              fontWeight: '500',
                            }}>
                              Send ({Math.floor(voiceRecorder.state.duration / 60)}:{(Math.floor(voiceRecorder.state.duration % 60)).toString().padStart(2, '0')})
                            </Typography>
                          </>
                        )}
                      </View>
                    ) : (
                      <InputField
                        variant={isFocused ? "focused" : "dormant"}
                        inputRef={inputRef}
                        value={message}
                        onChangeText={handleTextChange}
                        onFocus={handleFocus}
                        onBlur={() => handleBlur(message)}
                        style={{ 
                          minHeight: isFocused ? 40 : 45,
                          backgroundColor: 'transparent',
                          marginLeft: isFocused ? 0 : 48,
                          marginRight: isFocused ? 0 : 48,
                        }}
                        multiline={isFocused}
                        autoFocus={false}
                      />
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Paperclip/Cancel button */}
            <Animated.View style={[
              {
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 20,
              },
              paperclipStyle
            ]}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                  backgroundColor: (voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) ? 
                    'rgba(255, 68, 68, 0.1)' : 'transparent',
                }}
                onPress={() => {
                  if (voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) {
                    handleVoiceCancel();
                  } else {
                    console.log("📎 [CHAT_INPUT] Paperclip clicked!", {
                      hasTogglePicker: !!togglePicker,
                      hasOnPickerToggle: !!onPickerToggle,
                      willCallTogglePicker: !!togglePicker,
                      willCallOnPickerToggle: !!onPickerToggle
                    });
                    togglePicker?.();
                    onPickerToggle?.();
                  }
                }}
              >
                <Feather
                  name={(voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) ? "x" : "paperclip"}
                  size={24}
                  color={(voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) ? 
                    '#ff4444' : Colors[theme].text}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Send button - absolutely positioned */}
            <Animated.View style={[
              {
                width: 40,
                height: 40,
              },
              sendButtonStyle
            ]}>
              <SendButton
                onSend={handleSend}
                canSend={canSend}
                variant={(isFocused || voiceRecorder.state.isRecording || voiceRecorder.state.audioUri) ? "focused" : "dormant"}
                onVoiceRecordStart={handleVoiceRecordToggle}
                onVoiceRecordEnd={handleVoiceRecordToggle}
                isRecording={voiceRecorder.state.isRecording}
                hasRecordedAudio={!!voiceRecorder.state.audioUri}
                onVoiceSend={handleVoiceSend}
              />
            </Animated.View>

            {/* Separator line (appears when focused) */}
            <Animated.View style={separatorStyle} />

            {/* Bottom section - space for morphed buttons */}
            <View style={{
              height: 53, // Same height as top section
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}>
              {/* This space is where the morphed buttons appear */}
            </View>

          </Animated.View>
        </Animated.View>
      )}


      <FilePickerBottomSheet
        visible={(() => {
          const conditions = {
            isPickerOpen: isPickerOpen ?? false,
            isRecording: voiceRecorder.state.isRecording,
            hasAudioUri: !!voiceRecorder.state.audioUri,
            isSendingVoice,
            isUploadingAudio
          };
          
          const shouldShow = conditions.isPickerOpen && 
                           !conditions.isRecording && 
                           !conditions.hasAudioUri && 
                           !conditions.isSendingVoice && 
                           !conditions.isUploadingAudio;
          
          return shouldShow;
        })()}
        onSelect={handlePickerSelect}
        selectedType={selectedPickerType}
        chatFunctions={{
          ...chatFunctions,
          sendMediaMessage: chatFunctions?.sendMediaMessage ? 
            (caption: string, mediaAssets: any[]) => chatFunctions.sendMediaMessage!(caption, mediaAssets, replyMessage) :
            undefined,
          closeModal,
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatInput;
