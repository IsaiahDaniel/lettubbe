import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator, PanResponder, Dimensions, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '@/constants';
import Icons from '@/constants/Icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { useVoiceMessage } from '@/contexts/VoiceMessageContext';
import MessageAvatar from '../MessageAvatar';
import MessageTimestamp from './MessageTimestamp';
import ReplyPreview from './ReplyPreview';

// Type imports using explicit module paths
type AVPlaybackStatus = import('expo-av/build/AV.types').AVPlaybackStatus;
type AudioSound = import('expo-av/build/Audio/Sound').Sound;

interface VoiceMessageRendererProps {
  audioUri: string;
  duration: number;
  isCurrentUser: boolean;
  waveformData?: number[];
  caption?: string;
  item?: any;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean; // control positioning
  highlightedMessageId?: string | null;
  scrollToMessage?: (messageId: string) => void;
}

const VoiceMessageRenderer: React.FC<VoiceMessageRendererProps> = ({
  audioUri,
  duration,
  isCurrentUser,
  waveformData = [],
  caption,
  item,
  formattedTime,
  shouldShowTimestamp,
  onUserPress,
  useOwnPositioning = false,
  highlightedMessageId,
  scrollToMessage,
}) => {
  const { theme } = useCustomTheme();
  const { currentlyPlayingId, setCurrentlyPlaying, stopCurrentAudio, isPlaying: isGloballyPlaying } = useVoiceMessage();
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const messageId = item?._id?.toString() || item?.id?.toString() || `voice-${audioUri?.slice(-20)}`;
  const isHighlighted = highlightedMessageId === messageId;
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [sound, setSound] = useState<AudioSound | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // Determine if this specific message is playing
  const isPlaying = isGloballyPlaying(messageId) && isLocalPlaying;

  // Animation values and refs
  const waveAnimValues = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0.2))
  ).current;
  const waveformRef = useRef<View>(null);
  const [waveformWidth, setWaveformWidth] = useState(0);

  // Refs to hold current values for pan responder
  const totalDurationRef = useRef(totalDuration);
  const waveformWidthRef = useRef(waveformWidth);
  const soundRef = useRef(sound);

  // Update refs when values change
  useEffect(() => {
    totalDurationRef.current = totalDuration;
  }, [totalDuration]);

  useEffect(() => {
    waveformWidthRef.current = waveformWidth;
  }, [waveformWidth]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Load audio duration on mount
  useEffect(() => {
    const loadAudioDuration = async () => {
      if ((!totalDuration || totalDuration === 0) && audioUri) {
        try {
          const { sound: tempSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: false }
          );

          const status = await tempSound.getStatusAsync();
          if (status.isLoaded && status.durationMillis) {
            const durationInSeconds = status.durationMillis / 1000;
            setTotalDuration(durationInSeconds);
          }

          await tempSound.unloadAsync();
        } catch (error) {
          console.error('Error loading audio duration:', error);
        }
      }
    };

    loadAudioDuration();
  }, [audioUri]);

  // Handle when this message gets stopped by another message
  useEffect(() => {
    // Only stop if another message is playing (not if no message is playing)
    if (currentlyPlayingId !== null && currentlyPlayingId !== messageId && isLocalPlaying) {
      console.log('🎵 [VOICE] This message stopped by another:', { currentlyPlayingId, messageId });
      setIsLocalPlaying(false);
      setCurrentPosition(0);
      if (sound) {
        sound.getStatusAsync().then(status => {
          if (status.isLoaded) {
            sound.pauseAsync().catch(console.error);
          }
        }).catch(console.error);
      }
    }
  }, [currentlyPlayingId, messageId, isLocalPlaying, sound]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      // console.log('🎵 [VOICE] Component unmounting, cleaning up:', { messageId, hasSound: !!sound });
      if (sound) {
        sound.getStatusAsync().then(status => {
          if (status.isLoaded) {
            console.log('🎵 [VOICE] Unloading sound on cleanup');
            sound.unloadAsync().catch(console.error);
          }
        }).catch(console.error);
      }
      // Clear from global state if this was the playing message
      if (currentlyPlayingId === messageId) {
        console.log('🎵 [VOICE] Clearing from global state');
        setCurrentlyPlaying(null, null);
      }
    };
  }, []);

  // Seeking handlers
  const handleSeek = useCallback(async (locationX: number) => {
    const currentWidth = waveformWidthRef.current;
    const currentDuration = totalDurationRef.current;

    if (currentWidth > 0 && currentDuration > 0) {
      const x = Math.max(0, Math.min(locationX, currentWidth));
      const newProgress = x / currentWidth;
      const newPosition = newProgress * currentDuration;
      setCurrentPosition(newPosition);

      // If we have sound, seek immediately
      const currentSound = soundRef.current;
      if (currentSound) {
        try {
          const status = await currentSound.getStatusAsync();
          if (status.isLoaded) {
            await currentSound.setPositionAsync(newPosition * 1000);
          }
        } catch (error) {
          console.error('Error seeking audio:', error);
        }
      }
    }
  }, []);

  // Pan responder for draggable progress
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleSeek(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt, gestureState) => {
        handleSeek(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        handleSeek(evt.nativeEvent.locationX);
      },
    })
  ).current;

  // Waveform animation
  useEffect(() => {
    if (isPlaying) {
      const animations = waveAnimValues.map((animValue, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: Math.random() * 0.6 + 0.4,
              duration: 400 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 0.2,
              duration: 400 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        )
      );

      // Stagger animations
      animations.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 50);
      });

      return () => animations.forEach(anim => anim.stop());
    } else {
      // Reset to default state
      waveAnimValues.forEach(animValue => {
        animValue.setValue(0.2);
      });
    }
  }, [isPlaying, waveAnimValues]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    // console.log('🎵 [VOICE] handlePlayPause called:', {
    //   messageId,
    //   audioUri: audioUri?.substring(0, 50) + '...',
    //   hasSound: !!sound,
    //   isPlaying,
    //   isLocalPlaying,
    //   currentlyPlayingId
    // });

    try {
      setIsLoading(true);

      // If another audio is playing, stop it first
      if (currentlyPlayingId && currentlyPlayingId !== messageId) {
        console.log('🎵 [VOICE] Stopping other audio:', currentlyPlayingId);
        await stopCurrentAudio();
      }

      if (sound) {
        if (isPlaying) {
          console.log('🎵 [VOICE] Pausing current sound');
          await sound.pauseAsync();
          setIsLocalPlaying(false);
          setCurrentlyPlaying(null, null);
          setIsLoading(false);
          return;
        } else {
          // Check if sound is still loaded before using it
          const status = await sound.getStatusAsync();
          console.log('🎵 [VOICE] Existing sound status:', status);
          if (!status.isLoaded) {
            console.log('🎵 [VOICE] Sound not loaded, recreating...');
            // Unload the old sound first
            try {
              await sound.unloadAsync();
            } catch (e) {
              console.log('🎵 [VOICE] Error unloading old sound:', e);
            }
            setSound(null);
            // Let it fall through to create new sound
          } else {
            console.log('🎵 [VOICE] Using existing loaded sound');
            // Reset position if at end
            if (currentPosition >= totalDuration) {
              await sound.setPositionAsync(0);
              setCurrentPosition(0);
            }
            await sound.playAsync();
            setIsLocalPlaying(true);
            setCurrentlyPlaying(messageId, sound);
            setIsLoading(false);
            console.log('🎵 [VOICE] Started playback with existing sound');
            return;
          }
        }
      }
      
      // Create new sound if we don't have one or it's not loaded
      // console.log('🎵 [VOICE] Creating new sound...');
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          shouldPlay: false,
          rate: playbackSpeed,
          volume: 1.0,
          isLooping: false,
        },
        (status: AVPlaybackStatus) => {
          // console.log('🎵 [VOICE] Status update:', { 
          //   isLoaded: status.isLoaded, 
          //   didJustFinish: status.didJustFinish,
          //   positionMillis: status.positionMillis,
          //   durationMillis: status.durationMillis
          // });
          
          if (status.isLoaded) {
            // Update duration from actual audio file
            if (status.durationMillis && totalDurationRef.current === 0) {
              const duration = status.durationMillis / 1000;
              setTotalDuration(duration);
              totalDurationRef.current = duration;
            }

            if (status.didJustFinish) {
              console.log('🎵 [VOICE] Audio finished playing');
              setIsLocalPlaying(false);
              setCurrentlyPlaying(null, null);
              setCurrentPosition(0);
              // Stop and reset position to start for next play
              const currentSound = soundRef.current;
              if (currentSound) {
                currentSound.stopAsync().then(() => {
                  currentSound.setPositionAsync(0);
                }).catch(console.error);
              }
            } else if (status.positionMillis !== undefined) {
              setCurrentPosition(status.positionMillis / 1000);
            }
          }
        }
      );
      
      // console.log('🎵 [VOICE] Sound created, setting state...');
      setSound(newSound);

      // Now manually start playback
      console.log('🎵 [VOICE] Starting playback...');
      await newSound.playAsync();
      setIsLocalPlaying(true);
      setCurrentlyPlaying(messageId, newSound);
      console.log('🎵 [VOICE] Playback started successfully');
      
    } catch (error) {
      console.error('🎵 [VOICE] Error playing audio:', error);
      setIsLocalPlaying(false);
      setCurrentlyPlaying(null, null);
    } finally {
      setIsLoading(false);
    }
  };


  const generateWaveform = () => {
    return waveAnimValues.map((animValue, index) => (
      <Animated.View
        key={index}
        style={[
          styles.waveformBar,
          {
            backgroundColor: Colors[theme].text,
            opacity: 0.7,
            transform: [
              {
                scaleY: animValue,
              },
            ],
          },
        ]}
      />
    ));
  };

  const progress = totalDuration > 0 ? Math.min(currentPosition / totalDuration, 1) : 0;
  const remainingTime = Math.max(totalDuration - currentPosition, 0);

  // Show remaining time when playing, total duration when stopped
  const displayTime = (isPlaying && currentPosition > 0) ? remainingTime : totalDuration;

  const renderVoiceContent = () => (
    <View style={styles.outerContainer}>
      {/* Clean Background */}
      {item && item.repliedTo && (
        <ReplyPreview message={item} onPress={scrollToMessage} />
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: isCurrentUser
              ? Colors[theme].chatSender
              : Colors[theme].chatReceiver,
          },
          isHighlighted && {
            backgroundColor: Colors.general.primary + '20',
          },
        ]}
      >

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            {
              backgroundColor: isCurrentUser
                ? Colors[theme].chatSender
                : Colors[theme].chatReceiver,
            }
          ]}
          onPress={handlePlayPause}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors[theme].text}
            />
          ) : (
            <Image 
              source={isPlaying ? Icons.pause : Icons.play}
              style={{ 
                width: 24, 
                height: 24, 
                tintColor: Colors[theme].text 
              }}
            />
          )}
        </TouchableOpacity>

        {/* Waveform Section */}
        <View
          style={styles.waveformSection}
          {...panResponder.panHandlers}
          ref={waveformRef}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width > 0 && width !== waveformWidth) {
              setWaveformWidth(width);
            }
          }}
        >
          <View style={styles.waveformContainer}>
            {generateWaveform()}
          </View>

          {/* Progress overlay */}
          <View
            style={[
              styles.progressOverlay,
              { width: `${progress * 100}%` }
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isCurrentUser
                    ? 'rgba(0, 122, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.3)',
                }
              ]}
            />
          </View>
        </View>

        {/* Time Display */}
        <Text
          style={[
            styles.timeText,
            {
              color: Colors[theme].textLight,
            },
          ]}
        >
          {formatDuration(displayTime)}
        </Text>
      </View>
    </View>
  );

  if (useOwnPositioning) {
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isCurrentUser && item?.userId && (
          <MessageAvatar
            user={item.userId}
            onPress={() => onUserPress && onUserPress(typeof item.userId === "object" ? item.userId._id : item.userId)}
            disabled={!item.userId}
          />
        )}

        <View style={styles.messageWrapper}>
          {renderVoiceContent()}

          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isCurrentUser}
          />
        </View>
      </View>
    );
  }

  return renderVoiceContent();
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 6,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  messageWrapper: {
    maxWidth: "85%",
  },
  outerContainer: {
    width: '100%',
    maxWidth: '100%',
    minWidth: "80%",
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformSection: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 4,
    position: 'relative',
    backgroundColor: 'transparent',
    minWidth: 60,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    paddingHorizontal: 2,
    gap: 3,
  },
  waveformBar: {
    width: 2.5,
    height: 16,
    borderRadius: 1.25,
    minHeight: 4,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
    textAlign: 'right',
  },
});

export default React.memo(VoiceMessageRenderer);