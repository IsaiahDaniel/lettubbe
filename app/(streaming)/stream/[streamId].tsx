import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView, ImageBackground } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import HlsPlayer from '@/components/shared/streaming/HlsPlayer';
import useGetStream from '@/hooks/streaming/useGetStream';
import useAuth from '@/hooks/auth/useAuth';
import InfoBottomSheet from '@/components/ui/Modals/InfoBottomSheet';
import AppMenu from '@/components/ui/AppMenu';
import ShareStreamModal from '@/components/shared/streaming/ShareStreamModal';
import { Colors } from '@/constants';
import { formatNumber } from '@/helpers/utils/formatting';

const { width, height } = Dimensions.get('window');

const StreamViewerScreen = () => {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const { theme } = useCustomTheme();
  const insets = useSafeAreaInsets();
  const { userDetails } = useAuth();
  const { isPending, isSuccess, isError, error, data, streamKey, isRefetching, refetch } = useGetStream(streamId || '');
  
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Automatically refresh stream data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (streamId) {
        // console.log('🔄 StreamViewerScreen focused - refreshing stream data for:', streamId);
        refetch();
      }
    }, [streamId, refetch])
  );

  // Track orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);

  const isLandscape = screenDimensions.width > screenDimensions.height;

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleStreamError = useCallback((error: any) => {
    console.error('Stream playback error:', error);
  }, []);

  const handleLoadStart = useCallback(() => {
    console.log('Stream loading started');
  }, []);

  const handleLoad = useCallback(() => {
    console.log('Stream loaded successfully');
  }, []);

  const toggleInfo = useCallback(() => {
    const newShowInfo = !showInfo;
    setShowInfo(newShowInfo);
    
    // Refresh stream data when info sheet is opened to get latest view counts
    if (newShowInfo && streamId) {
      // console.log('📊 Info sheet opened - refreshing stream data for latest view count');
      refetch();
    }
  }, [showInfo, streamId, refetch]);


  const handleShareStream = useCallback(() => {
    setShowMenu(false);
    setShowShareModal(true);
  }, []);

  if (isError) {
    return (
      <View style={[styles.fullscreenContainer, { backgroundColor: '#000' }]}>
        <StatusBar hidden />
        
        {/* Error Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.errorOverlay}
        >
          <TouchableOpacity 
            onPress={handleBackPress} 
            style={[styles.errorBackButton, { top: insets.top + 16 }]}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#fff" />
            <Typography size={18} color="#fff" weight="600" style={styles.errorTitle}>
              Failed to load stream
            </Typography>
            <Typography size={14} color="rgba(255,255,255,0.8)" style={styles.errorMessage}>
              {error?.message || 'Unable to connect to the stream. Please check your connection and try again.'}
            </Typography>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Typography size={16} color="#fff" weight="600">
                Go Back
              </Typography>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.fullscreenContainer}>
      <StatusBar hidden />
      
      {/* Fullscreen Video Player */}
      {isPending ? (
        <View style={[styles.fullscreenContainer, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Typography size={16} color="#fff">Loading stream...</Typography>
        </View>
      ) : streamKey && data?.isLive ? (
        <HlsPlayer
          source={streamKey}
          onError={handleStreamError}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          autoPlay={true}
          onBack={handleBackPress}
          title={data?.title || 'Live Stream'}
          isLive={true}
          viewerCount={data?.views || 0}
          onInfoPress={data ? toggleInfo : undefined}
          onSharePress={handleShareStream}
          streamId={streamId} // Pass streamId for live chat
          enableLiveChat={true} // Enable live chat functionality
          isReconnecting={isRefetching && isError}
          initialLikeCount={data?.reactions?.likes?.length || 0}
          initialCommentCount={0} // Comments count comes from chat messages API and socket
          initialUserHasLiked={data?.reactions?.likes?.includes(userDetails?._id) || false}
          streamerData={{
            avatar: data?.user?.user?.profilePicture || data?.user?.profilePicture,
            username: data?.user?.user?.username || data?.user?.username,
            firstName: data?.user?.user?.firstName || data?.user?.firstName,
            lastName: data?.user?.user?.lastName || data?.user?.lastName,
          }}
          description={data?.description}
          onChatSend={(message) => {
            console.log('Live chat message:', message);
          }}
        />
      ) : data && (!streamKey || !data?.isLive) ? (
        // Stream data exists but not live - show upcoming or finished stream details
        <View style={[styles.fullscreenContainer, { backgroundColor: '#000' }]}>
          <StatusBar hidden />
          
          {/* Background Image */}
          {data.coverPhoto && (
            <ImageBackground
              source={{ uri: data.coverPhoto }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                style={styles.backgroundGradient}
              />
            </ImageBackground>
          )}
          
          {/* Header with Back Button */}
          <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={{ width: 24, height: 24 }} />
          </View>

          {/* Upcoming Stream Content */}
          <ScrollView 
            style={styles.upcomingContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.upcomingContentContainer}
          >
            {/* Stream Status Badge */}
            <View style={[styles.statusBadge, data.status === 'finished' && styles.finishedBadge]}>
              <Ionicons 
                name={data.status === 'finished' ? "checkmark-circle-outline" : "calendar-outline"} 
                size={16} 
                color={data.status === 'finished' ? "#22C55E" : "#FF6B35"} 
              />
              <Typography size={14} color={data.status === 'finished' ? "#22C55E" : "#FF6B35"} weight="600" style={{ marginLeft: 6 }}>
                {data.status === 'finished' ? 'FINISHED' : 'UPCOMING'}
              </Typography>
            </View>

            {/* Stream Title */}
            <Typography size={24} color="#fff" weight="700" style={styles.upcomingTitle}>
              {data.title}
            </Typography>

            {/* Stream Description */}
            {data.description && (
              <Typography size={16} color="rgba(255,255,255,0.8)" style={styles.upcomingDescription}>
                {data.description}
              </Typography>
            )}

            {/* Streamer Info */}
            {data.user && (
              <View style={styles.upcomingStreamerSection}>
                <View style={styles.upcomingStreamerRow}>
                  <Avatar
                    imageSource={data.user.user?.profilePicture || data.user.profilePicture}
                    size={48}
                    uri={true}
                    showRing={true}
                    ringColor={Colors.general.primary}
                    showTextFallback={true}
                    fallbackText={data.user.user?.firstName?.[0] || 
                                 data.user.firstName?.[0] || 
                                 data.user.user?.username?.[0] || 
                                 data.user.username?.[0] || 'S'}
                  />
                  <View style={styles.upcomingStreamerInfo}>
                    <Typography size={16} color="#fff" weight="600">
                      {data.user.user?.firstName || data.user.firstName} {data.user.user?.lastName || data.user.lastName}
                    </Typography>
                    <Typography size={14} color="rgba(255,255,255,0.7)">
                      @{data.user.user?.username || data.user.username}
                    </Typography>
                  </View>
                </View>
              </View>
            )}

            {/* Stream Details */}
            <View style={styles.upcomingDetailsSection}>
              {data.status === 'finished' ? (
                // Finished stream details
                <>
                  {data.endDate && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        Ended {new Date(data.endDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </View>
                  )}
                  
                  {data.views && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="eye" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        {formatNumber(data.views)} views
                      </Typography>
                    </View>
                  )}

                  {data.startDate && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        Started {new Date(data.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </View>
                  )}

                  {data.category && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="pricetag" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        {data.category}
                      </Typography>
                    </View>
                  )}
                </>
              ) : (
                // Upcoming stream details
                <>
                  {data.startDate && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        {new Date(data.startDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </View>
                  )}
                  
                  {data.time && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="time" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        {data.time}
                      </Typography>
                    </View>
                  )}

                  {data.category && (
                    <View style={styles.upcomingDetailRow}>
                      <Ionicons name="pricetag" size={20} color="rgba(255,255,255,0.7)" />
                      <Typography size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 12 }}>
                        {data.category}
                      </Typography>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Share Button - Only for upcoming streams */}
            {data.status !== 'finished' && (
              <TouchableOpacity style={styles.shareButton} onPress={handleShareStream}>
                <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Typography size={14} color="rgba(255,255,255,0.8)" weight="500" style={{ marginLeft: 6 }}>
                  Share
                </Typography>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      ) : (
        // No data or error state
        <View style={[styles.fullscreenContainer, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="videocam-off-outline" size={64} color="#fff" />
          <Typography size={16} color="#fff" style={{ marginTop: 16 }}>
            Stream not available
          </Typography>
        </View>
      )}

      {/* App Menu for Upcoming Streams */}
      {/* {data && !streamKey && (
        <View style={[styles.menuContainer, { paddingTop: insets.top + 16 }]}>
          <AppMenu
            trigger={(isOpen) => (
              <TouchableOpacity
                style={styles.menuTrigger}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            options={[
              {
                name: 'Share Stream',
                available: true,
              },
            ]}
            selectedOption=""
            onSelect={(option) => {
              if (option === 'Share Stream') {
                handleShareStream();
              }
            }}
          />
        </View>
      )} */}

      {/* Stream Info Bottom Sheet */}
      <InfoBottomSheet
        visible={showInfo}
        onClose={() => setShowInfo(false)}
      >
        {isLandscape ? (
          // Landscape Layout: Image left, details right
          <>
            {/* Cover Photo - Left Side */}
            <View style={styles.landscapeCoverContainer}>
              <ImageBackground
                source={{ uri: data?.coverPhoto }}
                style={styles.landscapeCoverPhoto}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.coverGradient}
                />
              </ImageBackground>
            </View>

            {/* Stream Information Content - Right Side */}
            <ScrollView 
              style={styles.landscapeInfoContent} 
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.landscapeStreamDetails}>
                {/* Stream Title */}
                <Typography size={18} weight="700" style={styles.sheetTitle}>
                  {data?.title || 'Live Stream'}
                </Typography>

                {/* Stream Category */}
                {data?.category && (
                  <Typography size={12} color={Colors[theme].textLight} style={styles.category}>
                    {data.category}
                  </Typography>
                )}

                {/* Streamer Information */}
                {data?.user && (
                  <View style={styles.streamerSection}>
                    <View style={styles.streamerRow}>
                      <Avatar
                        imageSource={data.user.user?.profilePicture || data.user.profilePicture}
                        size={36}
                        uri={true}
                        showRing={true}
                        ringColor={Colors.general.live}
                        showTextFallback={true}
                        fallbackText={data.user.user?.firstName?.[0] || 
                                     data.user.firstName?.[0] || 
                                     data.user.user?.username?.[0] || 
                                     data.user.username?.[0] || ''}
                      />
                      <View style={styles.streamerInfo}>
                        <Typography size={14} weight="600">
                          {data.user.user?.firstName || data.user.firstName} {data.user.user?.lastName || data.user.lastName}
                        </Typography>
                        <Typography size={12} color={Colors[theme].textLight}>
                          @{data.user.user?.username || data.user.username}
                        </Typography>
                      </View>
                    </View>
                  </View>
                )}

                {/* Stream Description */}
                {data?.description && (
                  <View style={styles.descriptionSection}>
                    <Typography size={14} weight="600" style={styles.sectionTitle}>
                      About this stream
                    </Typography>
                    <Typography size={12} color={Colors[theme].text} style={styles.descriptionText}>
                      {data.description}
                    </Typography>
                  </View>
                )}

                {/* Stream Stats */}
                <View style={styles.statsSection}>
                  <Typography size={14} weight="600" style={styles.sectionTitle}>
                    Stream Info {isRefetching && '🔄'}
                  </Typography>
                  <View style={styles.statRow}>
                    <Typography size={12} color={Colors[theme].textLight}>
                      Viewers: {formatNumber(data?.views || 0)}
                    </Typography>
                  </View>
                  {data?.isLive && (
                    <View style={styles.statRow}>
                      <View style={styles.liveIndicator}>
                        <Typography size={10} color="white" weight="600">
                          LIVE
                        </Typography>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </>
        ) : (
          // Portrait Layout: Original layout
          <>
            {/* Cover Photo */}
            <View style={styles.coverPhotoContainer}>
              <ImageBackground
                source={{ uri: data?.coverPhoto }}
                style={styles.coverPhoto}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.coverGradient}
                />
              </ImageBackground>
            </View>

            {/* Stream Information Content */}
            <ScrollView 
              style={styles.infoContent} 
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.streamDetails}>
                {/* Stream Title */}
                <Typography size={20} weight="700" style={styles.sheetTitle}>
                  {data?.title || 'Live Stream'}
                </Typography>

                {/* Stream Category */}
                {data?.category && (
                  <Typography size={14} color={Colors[theme].textLight} style={styles.category}>
                    {data.category}
                  </Typography>
                )}

                {/* Streamer Information */}
                {data?.user && (
                  <View style={styles.streamerSection}>
                    <View style={styles.streamerRow}>
                      <Avatar
                        imageSource={data.user.user?.profilePicture || data.user.profilePicture}
                        size={48}
                        uri={true}
                        showRing={true}
                        ringColor={Colors.general.live}
                        showTextFallback={true}
                        fallbackText={data.user.user?.firstName?.[0] || 
                                     data.user.firstName?.[0] || 
                                     data.user.user?.username?.[0] || 
                                     data.user.username?.[0] || 'S'}
                      />
                      <View style={styles.streamerInfo}>
                        <Typography size={16} weight="600">
                          {data.user.user?.firstName || data.user.firstName} {data.user.user?.lastName || data.user.lastName}
                        </Typography>
                        <Typography size={14} color={Colors[theme].textLight}>
                          @{data.user.user?.username || data.user.username}
                        </Typography>
                      </View>
                    </View>
                  </View>
                )}

                {/* Stream Description */}
                {data?.description && (
                  <View style={styles.descriptionSection}>
                    <Typography size={16} weight="600" style={styles.sectionTitle}>
                      About this stream
                    </Typography>
                    <Typography size={14} color={Colors[theme].text} style={styles.descriptionText}>
                      {data.description}
                    </Typography>
                  </View>
                )}

                {/* Stream Stats */}
                <View style={styles.statsSection}>
                  <Typography size={16} weight="600" style={styles.sectionTitle}>
                    Stream Info {isRefetching && '🔄'}
                  </Typography>
                  <View style={styles.statRow}>
                    <Typography size={14} color={Colors[theme].textLight}>
                      Viewers: {formatNumber(data?.views || 0)}
                    </Typography>
                  </View>
                  {data?.isLive && (
                    <View style={styles.statRow}>
                      <View style={styles.liveIndicator}>
                        <Typography size={10} color="white" weight="600">
                          LIVE
                        </Typography>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </InfoBottomSheet>

      {/* Share Stream Modal */}
      {data && (
        <ShareStreamModal
          isVisible={showShareModal}
          onClose={() => setShowShareModal(false)}
          streamData={data}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    flex: 1,
  },
  infoContent: {
    flex: 1,
  },
  streamDetails: {
    padding: 20,
  },
  sheetTitle: {
    marginBottom: 8,
    lineHeight: 26,
  },
  category: {
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  streamerSection: {
    marginBottom: 24,
  },
  streamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streamerInfo: {
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  statRow: {
    marginBottom: 8,
  },
  liveIndicator: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  errorOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  errorBackButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
    maxWidth: '80%',
  },
  errorTitle: {
    marginTop: 16,
  },
  errorMessage: {
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  // Landscape styles
  landscapeCoverContainer: {
    width: '50%',
    height: '100%',
  },
  landscapeCoverPhoto: {
    width: '100%',
    height: '100%',
  },
  landscapeInfoContent: {
    flex: 1,
    width: '50%',
  },
  landscapeStreamDetails: {
    padding: 16,
    paddingTop: 20,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  upcomingContent: {
    flex: 1,
    marginTop: 100, // Space for header
  },
  upcomingContentContainer: {
    padding: 24,
    paddingTop: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: '#FF6B35',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  finishedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: Colors.general.primary,
  },
  upcomingTitle: {
    marginBottom: 16,
    lineHeight: 32,
  },
  upcomingDescription: {
    marginBottom: 24,
    lineHeight: 24,
  },
  upcomingStreamerSection: {
    marginBottom: 32,
  },
  upcomingStreamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingStreamerInfo: {
    flex: 1,
  },
  upcomingDetailsSection: {
    marginBottom: 32,
  },
  upcomingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 16,
    zIndex: 1000,
  },
  menuTrigger: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomSheetShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 24,
    alignSelf: 'center',
  },
});

export default StreamViewerScreen;