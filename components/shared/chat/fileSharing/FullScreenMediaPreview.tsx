import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import * as FileSystem from 'expo-file-system';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import CustomAlert from '@/components/ui/CustomAlert';
import VoiceMessageRenderer from '@/components/shared/chat/renderers/VoiceMessageRenderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_TOTAL_SIZE_MB = 30;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

interface FullScreenMediaPreviewProps {
  mediaUri: string;
  mediaType: 'photo' | 'video' | 'audio';
  isSelected: boolean;
  onToggleSelection: () => void;
  onSend: (caption: string) => void;
  onBack: () => void;
  visible: boolean;
  mediaWidth?: number;
  mediaHeight?: number;
}

const FullScreenMediaPreview: React.FC<FullScreenMediaPreviewProps> = ({
  mediaUri,
  mediaType,
  isSelected,
  onToggleSelection,
  onSend,
  onBack,
  visible,
  mediaWidth,
  mediaHeight,
}) => {
  const { theme } = useCustomTheme();
  const { showError, alertConfig, isVisible, hideAlert } = useCustomAlert();
  const [caption, setCaption] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isCheckingFileSize, setIsCheckingFileSize] = useState(true);
  const insets = useSafeAreaInsets();

  // Calculate dynamic dimensions based on media aspect ratio
  const getMediaDimensions = () => {
    if (!mediaWidth || !mediaHeight) {
      // Fallback to fixed dimensions if no dimensions provided
      return {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.75,
      };
    }

    const mediaAspectRatio = mediaWidth / mediaHeight;
    const maxWidth = SCREEN_WIDTH;
    const maxHeight = SCREEN_HEIGHT * 0.75; // Use 75% of screen height as max

    // Calculate dimensions that fit within bounds while maintaining aspect ratio
    let displayWidth = maxWidth;
    let displayHeight = maxWidth / mediaAspectRatio;

    // If height exceeds max, scale down
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = maxHeight * mediaAspectRatio;
    }

    return {
      width: displayWidth,
      height: displayHeight,
    };
  };

  const mediaDimensions = getMediaDimensions();

  // Check file size when component mounts or mediaUri changes
  useEffect(() => {
    const checkFileSize = async () => {
      if (!mediaUri) return;
      
      setIsCheckingFileSize(true);
      try {
        const size = await getFileSize(mediaUri);
        setFileSize(size);
      } catch (error) {
        console.error('Error checking file size:', error);
        setFileSize(null);
      } finally {
        setIsCheckingFileSize(false);
      }
    };

    checkFileSize();
  }, [mediaUri]);

  // Check if file is too large
  const isFileTooLarge = fileSize !== null && fileSize > MAX_TOTAL_SIZE_BYTES;
  const canSend = !isCheckingFileSize && !isFileTooLarge;
  
  // Video player setup
  const player = useVideoPlayer(mediaType === 'video' ? mediaUri : '', (player) => {
    player.loop = true;
    player.muted = false;
    player.play();
  });

  // Subscribe to player events
  const { isPlaying: playerIsPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  // Update playing state
  useEffect(() => {
    setIsPlaying(playerIsPlaying);
    if (!playerIsPlaying) {
      // Show play button when video is paused
      setShowPlayButton(true);
    }
  }, [playerIsPlaying]);

  useEffect(() => {
    if (visible) {
      // Make status bar transparent
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setBarStyle('light-content', true);
      
      // Auto-play video when modal becomes visible
      if (mediaType === 'video' && player) {
        player.play();
      }
    }
  }, [visible, mediaType, player]);

  useEffect(() => {
    if (!visible) return;

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Force status bar to stay transparent
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setBarStyle('light-content', true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Maintain status bar settings
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setBarStyle('light-content', true);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [visible]);

  // Helper function to get file size
  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? (fileInfo.size || 0) : 0;
    } catch (error) {
      console.warn('Error getting file size:', error);
      return 0;
    }
  };

  // Format bytes to readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSend = () => {
    // Only send if file size is within limits
    if (canSend) {
      onSend(caption);
    }
  };

  const handleVideoPress = () => {
    if (mediaType === 'video' && player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
        // Show play button briefly when starting to play, then hide it
        setShowPlayButton(true);
        setTimeout(() => {
          setShowPlayButton(false);
        }, 2000);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: '#000',
        }}
        behavior="height"
        enabled={false}
        keyboardVerticalOffset={0}
      >
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: insets.top + 12,
            backgroundColor: '#000',
          }}
        >
        <TouchableOpacity onPress={onBack}>
          <Feather name="chevron-left" size={24} color="white" />
        </TouchableOpacity>

        <Typography size={16} weight="600" color="white">
          {mediaType === 'video' ? 'Video Preview' : mediaType === 'audio' ? 'Audio Preview' : 'Photo Preview'}
        </Typography>

        {/* Selection Circle - only show for photos */}
        {mediaType === 'photo' && (
          <TouchableOpacity
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={onToggleSelection}
          >
            {isSelected ? (
              <View
                style={{
                  backgroundColor: Colors.general.primary,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="check" size={16} color="white" />
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                }}
              />
            )}
          </TouchableOpacity>
        )}
        
        {/* Spacer for videos and audio */}
        {(mediaType === 'video' || mediaType === 'audio') && (
          <View style={{ width: 24, height: 24 }} />
        )}
      </View>

      {/* Media Display */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}
      >
        {mediaType === 'video' ? (
          <>
            <VideoView
              player={player}
              style={{
                width: mediaDimensions.width,
                height: mediaDimensions.height,
              }}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              contentFit="contain"
              nativeControls={false}
            />
            {/* Touch overlay for video controls */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: showPlayButton ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
              }}
              onPress={handleVideoPress}
              activeOpacity={1}
            >
              {/* Play/Pause Button */}
              {showPlayButton && (
                <View
                  style={{
                    // backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 100,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={46} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : mediaType === 'audio' ? (
          <View style={{
            width: SCREEN_WIDTH,
            maxWidth: 400,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: 20,
              width: '100%',
              alignItems: 'center',
            }}>
              <Feather name="music" size={80} color="white" style={{ marginBottom: 20 }} />
              <Typography size={18} weight="600" color="white" style={{ textAlign: 'center', marginBottom: 10 }}>
                Audio File
              </Typography>
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: mediaUri }}
            style={{
              width: mediaDimensions.width,
              height: mediaDimensions.height,
            }}
            resizeMode="contain"
          />
        )}
      </View>

        {/* Caption Input */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#000',
            padding: 16,
            paddingBottom: Platform.OS === 'ios' ? 34 : 16,
          }}
        >
          {/* File size status */}
          {isCheckingFileSize && (
            <View style={{ marginBottom: 8, alignItems: 'center' }}>
              <Typography size={12} color="rgba(255,255,255,0.7)">
                Checking file size...
              </Typography>
            </View>
          )}
          
          {isFileTooLarge && fileSize && (
            <View style={{ marginBottom: 8, alignItems: 'center' }}>
              <Typography size={12} color="#ff4444" style={{ textAlign: 'center' }}>
                File too large: {formatFileSize(fileSize)}
              </Typography>
              <Typography size={10} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center' }}>
                Maximum allowed: {MAX_TOTAL_SIZE_MB}MB
              </Typography>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                borderRadius: 20,
                paddingHorizontal: 15,
                paddingVertical: 10,
                fontSize: 16,
                minHeight: 40,
                maxHeight: 100,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              multiline
              editable={canSend} // Disable input when file is too large
            />

            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: canSend ? Colors.general.primary : 'rgba(255,255,255,0.3)',
                marginBottom: 2,
                opacity: canSend ? 1 : 0.5,
              }}
              onPress={handleSend}
              activeOpacity={canSend ? 0.8 : 1}
              disabled={!canSend}
            >
              <Feather name="send" size={20} color={canSend ? "white" : "rgba(255,255,255,0.5)"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          primaryButton={alertConfig.primaryButton}
          secondaryButton={alertConfig.secondaryButton}
          onClose={hideAlert}
          variant={alertConfig.variant}
        />
      )}
    </Modal>
  );
};

export default FullScreenMediaPreview;