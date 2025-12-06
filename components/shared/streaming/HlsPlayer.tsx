import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions, Keyboard, ImageBackground, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { VideoRef } from 'react-native-video';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors, Images } from '@/constants';
import Icons from '@/constants/Icons';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { formatNumber } from '@/helpers/utils/formatting';
import LiveChatInput, { EmojiPicker, LiveChatInputRef } from './LiveChatInput';
import LiveStreamProgressBar from './LiveStreamProgressBar';
import LiveChatMessagesOverlay from './LiveChatMessagesOverlay';
import StreamLikeAnimation from './StreamLikeAnimation';
import useStreamingChatMessages from '@/hooks/streaming/useStreamingChatMessages';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HlsPlayerProps {
  source: string;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoad?: () => void;
  poster?: string;
  autoPlay?: boolean;
  style?: any;
  onBack?: () => void;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  onInfoPress?: () => void;
  onChatSend?: (message: string) => void;
  onSharePress?: () => void;
  streamId?: string; // For live chat messages
  enableLiveChat?: boolean;
  isReconnecting?: boolean; // Show reconnection spinner
  initialLikeCount?: number; // Initial like count from stream data
  initialCommentCount?: number; // Initial comment count from stream data
  initialUserHasLiked?: boolean; // Whether current user has liked the stream
  streamerData?: {
    avatar?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  description?: string;
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({
  source,
  onError,
  onLoadStart,
  onLoad,
  poster,
  autoPlay = true,
  onBack,
  title = 'Live Stream',
  isLive = true,
  viewerCount,
  onInfoPress,
  onChatSend,
  onSharePress,
  streamId,
  enableLiveChat = true,
  isReconnecting = false,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialUserHasLiked = false,
  streamerData,
  description
}) => {
  const { theme } = useCustomTheme();
  const insets = useSafeAreaInsets();

  // Helper function to truncate description to 5 words
  const truncateDescription = (text: string): string => {
    const words = text.trim().split(/\s+/);
    return words.length > 5 ? words.slice(0, 5).join(' ') + '...' : text;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(!autoPlay);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [likeAnimationTrigger, setLikeAnimationTrigger] = useState(0);
  const [likeButtonPosition, setLikeButtonPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const videoRef = useRef<VideoRef>(null);
  const chatInputRef = useRef<LiveChatInputRef>(null);
  const likeButtonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const triggerLikeAnimation = useCallback(() => {
    setLikeAnimationTrigger(prev => prev + 1);
  }, []);

  // Measure like button position for animation
  const measureLikeButtonPosition = useCallback(() => {
    if (likeButtonRef.current) {
      // measureInWindow for more reliable screen coordinates
      likeButtonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        // Only set position if we got valid measurements
        if (x > 0 || y > 0) {
          const buttonCenter = {
            x: x + width / 2, // Center of button
            y: y + height / 2  // Center of button
          };
          console.log('🎯 Like button position measured:', {
            raw: { x, y, width, height },
            center: buttonCenter
          });
          setLikeButtonPosition(buttonCenter);
        } else {
          console.log('⚠️ Invalid button measurements, retrying...', { x, y, width, height });
          // Retry measurement after a short delay if coordinates are invalid
          setTimeout(() => {
            measureLikeButtonPosition();
          }, 100);
        }
      });
    }
  }, []);

  // Live chat integration
  const {
    messages: liveMessages,
    sendMessage: sendLiveMessage,
    sendLike: sendStreamLike,
    streamLikes,
    userHasLiked,
    streamCommentsCount,
    isConnected: isChatConnected,
    connectionError
  } = useStreamingChatMessages({
    streamId: streamId || '',
    enabled: enableLiveChat && !!streamId,
    onLikeAnimationTrigger: triggerLikeAnimation
  });

  // Calculate effective comment count: use socket data if available, otherwise use initial count
  const effectiveCommentCount = streamCommentsCount > 0 ? streamCommentsCount : (liveMessages.length > 0 ? liveMessages.length : initialCommentCount);


  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    onLoadStart?.();
  };

  const handleLoad = (data: any) => {
    setLoading(false);
    setDuration(data.duration || 0);
    onLoad?.();
  };

  const handleProgress = (data: any) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime || 0);
    }
  };

  const handleError = (error: any) => {
    setLoading(false);
    
    // Check if this is a stream offline error (404, source error, etc.)
    const isStreamOffline = error?.error?.errorCode === "22004" || 
                           error?.error?.errorString?.includes('ERROR_CODE_IO_BAD_HTTP_STATUS') ||
                           error?.error?.errorException?.includes('Response code: 404') ||
                           error?.error?.errorException?.includes('Source error');
    
    if (isStreamOffline) {
      setError('STREAM_OFFLINE');
    } else {
      setError('Failed to load stream. Please try again.');
    }
    
    onError?.(error);
  };

  // Control visibility management
  const resetControlsTimeout = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    hideControlsTimeout.current = setTimeout(() => {
      if (!paused && !loading && !error) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleScreenTap = () => {
    if (showControls) {
      setShowControls(false);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    } else {
      resetControlsTimeout();
    }
  };

  const togglePlayPause = () => {
    setPaused(!paused);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    setMuted(!muted);
    resetControlsTimeout();
  };

  const handleBackPress = () => {
    onBack?.();
  };

  const handleChatSend = (message: string) => {
    // The sendLiveMessage function handles optimistic messages internally
    if (enableLiveChat && streamId) {
      sendLiveMessage(message);
    }

    // Also call the callback for any additional handling
    onChatSend?.(message);
    resetControlsTimeout(); // Reset controls timeout when user sends a message
  };

  const handleEmojiPickerToggle = (show: boolean) => {
    setShowEmojiPicker(show);
    if (show) {
      // Keep controls visible when emoji picker is open
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    } else {
      // Resume normal control timeout when emoji picker closes
      resetControlsTimeout();
    }
  };

  const handleEmojiPress = (emoji: string) => {
    // Add emoji to input without closing the picker
    chatInputRef.current?.addEmoji(emoji);
    // Keep the picker open for multiple emoji selection
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeekComplete = (time: number) => {
    setIsSeeking(false);
    if (videoRef.current) {
      videoRef.current.seek(time);
    }
  };

  const handleJumpToLive = () => {
    if (videoRef.current && duration > 0) {
      videoRef.current.seek(duration);
      setCurrentTime(duration);
    }
  };

  const handleCommentPress = () => {
    setShowChatInput(true);
    setShowControls(true);
    // Focus the chat input
    setTimeout(() => {
      chatInputRef.current?.focus?.();
    }, 100);
  };

  const handleLovePress = () => {
    // Ensure button position is measured before triggering animation
    if (!likeButtonPosition) {
      measureLikeButtonPosition();
      // Delay the animation slightly to allow measurement to complete
      setTimeout(() => {
        triggerLikeAnimation();
      }, 50);
    } else {
      triggerLikeAnimation();
    }
    
    // The sendStreamLike function handles connection state internally
    if (enableLiveChat && streamId) {
      sendStreamLike();
    }
    
    resetControlsTimeout(); // Reset controls timeout when user likes
  };

  // Animate controls
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showControls ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showControls, fadeAnim]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      // Hide chat input when keyboard closes
      setShowChatInput(false);
      // Also close emoji picker if open
      setShowEmojiPicker(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  // Show controls when paused, loading, or error
  useEffect(() => {
    if (paused || loading || error) {
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    } else {
      resetControlsTimeout();
    }
  }, [paused, loading, error]);

  if (error) {
    // Show SMPTE screen for offline streams
    if (error === 'STREAM_OFFLINE') {
      return (
        <View style={styles.fullscreenContainer}>
          <View style={styles.smpteContainer}>
            <ImageBackground
              source={Images.SMPTE}
              style={styles.smpteBackground}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.smpteOverlay}
              >
                <View style={styles.smpteContent}>
                  <Typography size={24} color="white" weight="700" style={styles.offlineTitle}>
                    STREAM OFFLINE
                  </Typography>
                  <Typography size={16} color="rgba(255,255,255,0.9)" style={styles.offlineMessage}>
                    The streamer is currently offline.
                  </Typography>
                  <Typography size={14} color="rgba(255,255,255,0.7)" style={styles.offlineSubMessage}>
                    Please check back later or try refreshing.
                  </Typography>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => {
                      setError(null);
                      setLoading(true);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="white" />
                    <Typography size={14} color="white" weight="600" style={styles.refreshText}>
                      Refresh
                    </Typography>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>
      );
    }

    // Show regular error screen for other errors
    return (
      <View style={styles.errorOverlay}>
        <View style={styles.errorContent}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors[theme].textLight}
          />
          <Typography size={16} color={Colors[theme].textLight} style={styles.errorMessage}>
            {error}
          </Typography>
          <TouchableOpacity
            style={styles.retryIconButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Typography size={14} color="#fff" weight="600">
              Retry
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullscreenContainer}>
      <TouchableWithoutFeedback onPress={handleScreenTap}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: source }}
            style={styles.video}
            controls={false}
            paused={paused}
            muted={muted}
            resizeMode="contain"
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onError={handleError}
            poster={poster}
            posterResizeMode="cover"
          />

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer} pointerEvents="none">
              <ActivityIndicator size="large" color="white" />
              <Typography size={14} color="white" style={styles.loadingText}>
                Loading stream...
              </Typography>
            </View>
          )}

          {/* Reconnection Indicator */}
          {isReconnecting && !loading && (
            <View style={styles.reconnectingContainer} pointerEvents="none">
              <ActivityIndicator size="large" color="white" />
              <Typography size={16} color="white" style={styles.reconnectingText}>
                Reconnecting...
              </Typography>
            </View>
          )}

          {/* Controls Overlay */}
          <Animated.View
            style={[styles.controlsOverlay, { opacity: fadeAnim }]}
            pointerEvents={showControls ? "auto" : "none"}
          >
            {/* Top Controls */}
            {onBack && (
              <View style={styles.topSection}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'transparent']}
                  style={[styles.topGradient, { paddingTop: insets.top + 8 }]}
                >
                  <View style={styles.topControls}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                      <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.topInfo}>
                      <View style={styles.liveInfo}>
                        {/* <View style={[styles.liveIndicator, { backgroundColor: isLive ? '#FF4444' : '#666' }]}>
                          <View style={styles.liveDot} />
                          <Typography size={12} color="#fff" weight="600">
                            {isLive ? 'LIVE' : 'STREAM'}
                          </Typography>
                        </View> */}
                        {viewerCount !== undefined && (
                          <Typography size={14} color="rgba(255,255,255,0.9)">
                            {formatNumber(viewerCount)} viewers
                          </Typography>
                        )}
                      </View>
                      {/* {title && (
                        <Typography size={14} color="rgba(255,255,255,0.9)" numberOfLines={1}>
                          {title}
                        </Typography>
                      )} */}
                    </View>

                    <View style={styles.topRightControls}>
                      {onInfoPress && (
                        <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
                          <Ionicons name="information-circle-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </LinearGradient>

                {/* Streamer Info Section */}
                {(streamerData || description) && (
                  <View style={styles.streamerInfoSection}>
                    <View style={styles.streamerInfoContainer}>
                      {streamerData?.avatar && (
                        <Avatar
                          imageSource={streamerData.avatar}
                          size={40}
                          uri={true}
                          showRing={true}
                          ringColor={Colors.general.live}
                          showTextFallback={true}
                          fallbackText={streamerData.firstName?.[0] || streamerData.username?.[0] || 'S'}
                        />
                      )}
                      <View style={styles.streamerTextContainer}>
                        {streamerData?.username && (
                          <Typography
                            size={14}
                            color="white"
                            weight="600"
                            numberOfLines={1}
                            style={styles.streamerUsername}
                          >
                            @{streamerData.username}
                          </Typography>
                        )}
                        {description && (
                          <Typography
                            size={12}
                            color="rgba(255,255,255,0.8)"
                            numberOfLines={1}
                            style={styles.streamerDescription}
                          >
                            {truncateDescription(description)}
                          </Typography>
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Center Controls */}
            <View style={styles.centerSection}>
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playPauseButton}
              >
                <Ionicons
                  name={paused ? 'play' : 'pause'}
                  size={40}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom, bottom: keyboardHeight }]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.bottomGradient}
              >
                
                {/* Progress Bar - Hidden when chat input is visible */}
                {!showChatInput && (
                  <LiveStreamProgressBar
                    currentTime={currentTime}
                    duration={duration}
                    isLive={isLive}
                    onSeek={handleSeek}
                    onSeekStart={handleSeekStart}
                    onSeekComplete={handleSeekComplete}
                    onJumpToLive={handleJumpToLive}
                  />
                )}
              </LinearGradient>
            </View>

            {/* Right Side Action Buttons */}
            {onChatSend && (
              <View style={[styles.rightActionButtons, { bottom: insets.bottom + 100 + keyboardHeight }]}>
                {/* Love/Like Button */}
                <TouchableOpacity
                  ref={likeButtonRef}
                  style={styles.actionButton}
                  onPress={handleLovePress}
                  activeOpacity={0.7}
                  onLayout={measureLikeButtonPosition}
                >
                  <Ionicons 
                    name={(userHasLiked || (!streamLikes.length && initialUserHasLiked)) ? "heart" : "heart-outline"} 
                    size={32} 
                    color={(userHasLiked || (!streamLikes.length && initialUserHasLiked)) ? "#FF4444" : "#FF4444"} 
                  />
                  {/* {(streamLikes.length > 0 || initialLikeCount > 0) && (
                    <Typography size={12} color="#fff" weight="600" style={styles.likeCount}>
                      {streamLikes.length > 0 ? streamLikes.length : initialLikeCount}
                    </Typography>
                  )} */}
                </TouchableOpacity>
                
                {/* Comment Button - Hidden when chat input is visible */}
                {!showChatInput && (
                  <TouchableOpacity
                    style={[styles.actionButton, {marginTop: -8}]}
                    onPress={handleCommentPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                    {effectiveCommentCount > 0 && (
                      <Typography size={12} color="#fff" weight="600" style={styles.likeCount}>
                        {effectiveCommentCount}
                      </Typography>
                    )}
                  </TouchableOpacity>
                )}

                {/* Share Button */}
                {onSharePress && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onSharePress}
                    activeOpacity={0.7}
                  >
                    <Image source={Icons.share} style={{ width: 28, height: 28, tintColor: '#fff' }} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* Chat Input - Outside animated controls so it stays visible with keyboard */}
          {onChatSend && showChatInput && (
            <View style={[styles.chatInputContainer, { 
              position: 'absolute',
              bottom: insets.bottom + keyboardHeight,
              left: 0,
              right: 0,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: 'rgba(0,0,0,0.7)'
            }]}>
              <LiveChatInput
                ref={chatInputRef}
                onSend={(message) => {
                  handleChatSend(message);
                  setShowChatInput(false); // Hide input after sending
                }}
                placeholder="Add a comment..."
                style={styles.chatInput}
                showEmojiPicker={showEmojiPicker}
                onEmojiPickerToggle={handleEmojiPickerToggle}
              />
            </View>
          )}

          {/* Emoji Picker - Always visible when active, outside control fade */}
          {/* {onChatSend && (
            <View style={[styles.emojiPickerContainer, { bottom: insets.bottom + 80 + keyboardHeight }]}>
              <EmojiPicker
                visible={showEmojiPicker}
                onEmojiPress={handleEmojiPress}
              />
            </View>
          )} */}
        </View>
      </TouchableWithoutFeedback>

      {/* Live Chat Messages Overlay - Outside TouchableWithoutFeedback for proper scrolling */}
      {enableLiveChat && streamId && liveMessages.length > 0 && (
        <LiveChatMessagesOverlay
          messages={liveMessages}
          maxVisibleMessages={50}
          keyboardHeight={keyboardHeight}
        />
      )}
      
      {/* Like Animation Overlay */}
      <StreamLikeAnimation 
        trigger={likeAnimationTrigger}
        buttonPosition={likeButtonPosition}
        containerStyle={{ zIndex: 1001 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: '#000',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    marginTop: 12,
  },
  reconnectingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 15,
  },
  reconnectingText: {
    marginTop: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  liveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  topGradient: {
    // paddingHorizontal: 8,
    // paddingBottom: 32,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    // paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topInfo: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingHorizontal: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    padding: 12,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  chatInputContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  chatInput: {
    flex: 1,
  },
  rightActionButtons: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 16,
    zIndex: 100,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeCount: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    textAlign: 'center',
    minWidth: 20,
  },
  emojiPickerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 24,
  },
  retryIconButton: {
    backgroundColor: Colors.general.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 16,
  },
  smpteContainer: {
    flex: 1,
  },
  smpteBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  smpteOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smpteContent: {
    alignItems: 'center',
    padding: 32,
    maxWidth: '80%',
  },
  offlineTitle: {
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  offlineMessage: {
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  offlineSubMessage: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshText: {
    letterSpacing: 0.5,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 100,
  },
  streamerInfoSection: {
    paddingHorizontal: 16,
  },
  streamerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  streamerTextContainer: {
    flex: 1,
    gap: 4,
  },
  streamerUsername: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streamerDescription: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 16,
  },
});

export default HlsPlayer;