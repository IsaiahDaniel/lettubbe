import React, { useState } from "react";
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Images } from "@/constants";
import Wrapper from "@/components/utilities/Wrapper";
import TopHeader from "@/components/ui/TopHeader";
import Typography from "@/components/ui/Typography/Typography";
import BackButton from "@/components/utilities/BackButton";
import useGetNotifications from "@/hooks/notifications/useGetUserNotifications";
import { formatTime, formatTimePost, truncateText } from "@/helpers/utils/util";
import { formatVideoDuration } from "@/helpers/utils/formatting";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Avatar from "@/components/ui/Avatar";
import { useGetVideoItemStore } from "@/store/feedStore";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

const notifications = [
  {
    id: "1",
    type: "like",
    user: "Username",
    time: "45m ago",
    icon: "heart",
    image: Images.avatar,
  },
  {
    id: "2",
    type: "comment",
    user: "Username",
    time: "48m ago",
    text: "I’m so in love with this",
    icon: "chatbubble",
    image: Images.avatar,
  },
  {
    id: "3",
    type: "like",
    user: "Username",
    time: "48m ago",
    reply: "I’m so in love with this",
    icon: "heart",
    image: Images.avatar,
  },
  {
    id: "4",
    type: "like-group",
    users: 48,
    time: "50m ago",
    icon: "heart",
    image: Images.avatar,
  },
  {
    id: "5",
    type: "post",
    user: "Username",
    time: "45m ago",
    icon: "notifications",
    image: Images.avatar,
  },
];

const NotificationScreen = () => {
  const { data, filters, selectedFilter, setSelectedFilter, isPending } =
    useGetNotifications();

  const { theme } = useCustomTheme();
  const { setSelectedItem } = useGetVideoItemStore();
  const queryClient = useQueryClient();

  // Helper function to determine media type
  const getMediaType = (post: any) => {
    // Return null early if post is null/undefined
    if (!post) return null;
    
    if (post?.videoUrl && typeof post.videoUrl === 'string') {
      return 'video';
    } else if (post?.thumbnail || post?.photoUrl || (post?.images && Array.isArray(post.images) && post.images.length > 0)) {
      return 'photo';
    }
    return null;
  };

  // Helper function to get thumbnail URL from various possible sources
  const getThumbnailUrl = (item: any) => {
    // Check video thumbnail first
    if (item?.post?.thumbnail) {
      return item.post.thumbnail;
    }
    
    // Check images array for photo posts
    if (item?.post?.images && Array.isArray(item.post.images) && item.post.images.length > 0) {
      // Return the first image in the array
      return item.post.images[0];
    }
    
    // Check other possible sources
    return item?.post?.photoUrl || 
           item?.thumbnail || 
           item?.photoUrl ||
           item?.post?.image ||
           null;
  };

  // Clear notification badge when screen is focused (when visiting notifications)
  useFocusEffect(
    React.useCallback(() => {
      // Invalidate notification count to refresh the badge
      queryClient.invalidateQueries({ queryKey: ['getNotificationsCount'] });
    }, [queryClient])
  );


  const handleNotificationPress = (item: any) => {
    if (!item.post) {
      return;
    }

    const mediaType = getMediaType(item.post);
    if (!mediaType) {
      return;
    }

    // Create media item from post data - supporting both photos and videos
    const mediaItem = {
      _id: item.post._id,
      thumbnail: item.post.thumbnail,
      duration: item.post.duration?.toString() || "",
      description: item.post.description || "",
      videoUrl: item.post.videoUrl || "",
      photoUrl: item.post.photoUrl || item.post.thumbnail || "", // Add photo URL support
      images: item.post.images || [], // Add images array for photo posts
      mediaType: mediaType as 'photo' | 'video', // Add media type identification
      createdAt: item.post.createdAt,
      comments: item.post.comments || [],
      reactions: {
        likes: item.post.reactions?.likes || []
      },
      viewCount: item.post.reactions?.totalViews || 0,
      commentCount: item.post.comments?.length || 0,
      isCommentsAllowed: item.post.isCommentsAllowed !== undefined ? item.post.isCommentsAllowed : true,
      user: {
        username: item.post.userId?.username || "",
        subscribers: item.post.userId?.subscribers || [],
        _id: item.post.userId?._id || "",
        firstName: item.post.userId?.firstName || "",
        lastName: item.post.userId?.lastName || "",
        profilePicture: item.post.userId?.profilePicture || ""
      }
    };

    // Set the selected item in the store
    setSelectedItem(mediaItem);

    // Navigate to appropriate viewer based on media type
    if (mediaType === 'photo') {
      // For photos, navigate to tabs - PhotoViewerModal will show automatically
      // selectedItem is already set in store above
      if (item.type === "comment" || item.subType === "commentLike" || item.subType === "replyLike") {
        // For comment-related notifications, navigate to tabs and let modal auto-show comments
        router.push('/(tabs)');
        // will add logic to auto-show comments via the modal
      } else {
        router.push('/(tabs)');
      }
    } else {
      // For videos, navigate to video player
      if (item.type === "comment" || item.subType === "commentLike" || item.subType === "replyLike") {
        router.push({
          pathname: "/(home)/VideoPlayer",
          params: { showComments: "true", commentId: item.commentId || "" }
        });
      } else {
        router.push("/(home)/VideoPlayer");
      }
    }
  };

  return (
    <Wrapper>
      <BackButton />
      <View style={{ paddingTop: 15 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 15 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={{
                backgroundColor:
                  selectedFilter === filter ? Colors.general.primary : Colors[theme].cardBackground,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}
            >
              <Typography color={selectedFilter === filter ? "#fff" : undefined}>
                {filter}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Notification List */}
        <FlatList
          ListHeaderComponent={
            <Typography
              weight="600"
              textType="textBold"
              style={{ marginVertical: 16 }}
            >
              Last 7 days
            </Typography>
          }
          data={data?.data?.data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            // Debug for mentions and subscriptions
            if (item.type === "mention" || item.type === "subscription") {
              console.log("🔥 NOTIFICATION DEBUG:", {
                type: item.type,
                subType: item.subType,
                fullItem: JSON.stringify(item, null, 2),
                actorIds: item?.actorIds,
                actors: item?.actors,
                user: item?.user,
                userDetails: item?.userDetails
              });
            }
            
            // Handle different data structures for different notification types
            let actors, actorCount, firstActor;
            
            if (item.type === "subscription") {
              // For subscriptions, the user data is in userId field
              actors = item.userId ? [item.userId] : [];
              actorCount = actors.length;
              firstActor = item.userId;
            } else if (item.type === "mention") {
              // For mentions, check both actorIds and userId
              actors = item?.actorIds?.length > 0 ? item.actorIds : (item.userId ? [item.userId] : []);
              actorCount = actors.length;
              firstActor = actors[0];
            } else {
              // For likes, comments, etc. use actorIds as before
              actors = item?.actorIds || [];
              actorCount = actors.length;
              firstActor = actors[0];
            }
            return (
              <TouchableOpacity onPress={() => handleNotificationPress(item)} activeOpacity={0.7}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: 12,
                    gap: 16,
                  }}
                >
                  <View style={{ alignSelf: "center" }}>
                    <Ionicons
                      name={
                        item.type == "like" ? "heart" : 
                        item.type == "mention" ? "at" :
                        item.type == "subscription" ? "person-add" :
                        "chatbubble-outline"
                      }
                      size={16}
                      color={
                        item.type == "like" ? "#ff3366" : 
                        item.type == "mention" ? "#007AFF" :
                        item.type == "subscription" ? "#34C759" :
                        Colors[theme].text
                      }
                    />
                  </View>

                  <View style={{ flex: 1, gap: 4, marginTop: 5 }}>
                    {actorCount === 1 && firstActor?.profilePicture && (
                      <Avatar
                        imageSource={firstActor?.profilePicture}
                        uri={true}
                        size={30}
                        showRing={true}
                      />
                    )}

                    {actorCount > 1 && (
                      <View style={{ flexDirection: "row" }}>
                        {actors.slice(0, 4).map((actor: any, index: number) => (
                          <Avatar
                            key={actor._id}
                            imageSource={actor?.profilePicture}
                            uri={true}
                            size={30}
                            showRing={false}
                            ringColor="#fff"
                            ringThickness={1}
                            style={{
                              marginLeft: index === 0 ? 0 : -8,
                            }}
                          />
                        ))}
                      </View>
                    )}

                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}
                    >
                      <Typography weight="600" size={14} textType="textBold">
                        {actorCount === 1
                          ? `${firstActor?.firstName} ${firstActor?.lastName}`
                          : `${actorCount} people`}
                      </Typography>

                      {item.type == "like" && item.subType == "postLike" && (
                        <Typography textType="secondary">
                          liked your {item.post?.videoUrl ? 'video' : 'photo'}
                        </Typography>
                      )}

                      {item.subType == "commentLike" && (
                        <Typography textType="secondary">liked your Comment</Typography>
                      )}

                      {item.subType == "replyLike" && (
                        <Typography textType="secondary">liked your Reply</Typography>
                      )}

                      {item.type == "comment" && (
                        <View>
                          <Typography textType="secondary">commented</Typography>
                        </View>
                      )}

                      {item.type == "mention" && (
                        <Typography textType="secondary">
                          mentioned you in a {item.post?.videoUrl ? 'video' : 'photo'}
                        </Typography>
                      )}

                      {item.type == "subscription" && (
                        <Typography textType="secondary">
                          subscribed to your channel
                        </Typography>
                      )}
                    </View>
                    {item.type == "comment" && item?.commentText && (
                      <TouchableOpacity>
                        <Typography
                          weight="500"
                          size={14}
                          style={{
                            backgroundColor: Colors[theme].cardBackground,
                            alignSelf: "flex-start",
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            borderRadius: 12,
                          }}
                        >
                          {truncateText(item?.commentText, 40)}
                        </Typography>
                      </TouchableOpacity>
                    )}

                    {item.subType == "commentLike" && item?.commentText && (
                      <TouchableOpacity>
                        <Typography
                          weight="500"
                          size={12}
                          style={{
                            backgroundColor: Colors[theme].cardBackground,
                            alignSelf: "flex-start",
                            paddingVertical: 10,
                            paddingHorizontal: 7,
                            borderRadius: 5,
                          }}
                        >
                          {truncateText(item?.commentText, 40)}
                        </Typography>
                      </TouchableOpacity>
                    )}

                    {item.subType == "replyLike" && item?.commentText && (
                      <TouchableOpacity>
                        <Typography
                          weight="500"
                          size={12}
                          style={{
                            backgroundColor: Colors[theme].cardBackground,
                            width: "100%",
                            paddingVertical: 10,
                            paddingHorizontal: 7,
                            borderRadius: 5,
                          }}
                        >
                          {truncateText(item?.commentText, 40)}
                        </Typography>
                      </TouchableOpacity>
                    )}
                  </View>

                  {(item.type != "like" && item.type != "subscription") && (
                    <View style={{ position: 'relative' }}>
                      {getThumbnailUrl(item) ? (
                        <Image
                          source={{ uri: getThumbnailUrl(item) }}
                          style={{ 
                            width: 100, 
                            height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                            borderRadius: 5, 
                            backgroundColor: Colors[theme].cardBackground 
                          }}
                          onError={() => console.log('Failed to load thumbnail:', getThumbnailUrl(item))}
                          onLoad={() => console.log('Thumbnail loaded successfully:', getThumbnailUrl(item))}
                        />
                      ) : (
                        <View style={{ 
                          width: 100, 
                          height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                          borderRadius: 5, 
                          backgroundColor: Colors[theme].cardBackground,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Ionicons name="image-outline" size={24} color={Colors[theme].text} />
                        </View>
                      )}
                      {/* play icon overlay for videos */}
                      {/* {item.post?.videoUrl && (
                        <View style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -12 }, { translateY: -12 }],
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 12,
                          padding: 4
                        }}>
                          <Ionicons name="play" size={16} color="white" />
                        </View>
                      )} */}
                    </View>
                  )}

                  {item.subType == "commentLike" && (
                    <View style={{ position: 'relative' }}>
                      {getThumbnailUrl(item) ? (
                        <Image
                          source={{ uri: getThumbnailUrl(item) }}
                          style={{ 
                            width: 100, 
                            height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                            borderRadius: 5, 
                            backgroundColor: Colors[theme].cardBackground 
                          }}
                          onError={() => console.log('Failed to load commentLike thumbnail:', getThumbnailUrl(item))}
                        />
                      ) : (
                        <View style={{ 
                          width: 100, 
                          height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                          borderRadius: 5, 
                          backgroundColor: Colors[theme].cardBackground,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Ionicons name="image-outline" size={24} color={Colors[theme].text} />
                        </View>
                      )}
                      {/* play icon overlay for videos */}
                      {item?.post?.videoUrl && (
                        <View style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -12 }, { translateY: -12 }],
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 12,
                          padding: 4
                        }}>
                          <Ionicons name="play" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  )}

                  {item.subType == "replyLike" && (
                    <View style={{ position: 'relative' }}>
                      {getThumbnailUrl(item) ? (
                        <Image
                          source={{ uri: getThumbnailUrl(item) }}
                          style={{ 
                            width: 100, 
                            height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                            borderRadius: 5, 
                            backgroundColor: Colors[theme].cardBackground 
                          }}
                          onError={() => console.log('Failed to load replyLike thumbnail:', getThumbnailUrl(item))}
                        />
                      ) : (
                        <View style={{ 
                          width: 100, 
                          height: getMediaType(item?.post) === 'photo' ? 133 : 56, // Photos are taller (3:4 ratio), videos are 16:9
                          borderRadius: 5, 
                          backgroundColor: Colors[theme].cardBackground,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Ionicons name="image-outline" size={24} color={Colors[theme].text} />
                        </View>
                      )}
                      {/* play icon overlay for videos */}
                      {item?.post?.videoUrl && (
                        <View style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -12 }, { translateY: -12 }],
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 12,
                          padding: 4
                        }}>
                          <Ionicons name="play" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View>
                  {item.type == "like" && item.subType == "postLike" && (
                    <View style={{ 
                      position: "relative", 
                      width: "100%", 
                      aspectRatio: getMediaType(item?.post) === 'photo' ? 4/5 : 16/9 // Photos are taller (4:5), videos are wider (16:9)
                    }}>
                      {getThumbnailUrl(item) ? (
                        <Image
                          source={{ uri: getThumbnailUrl(item) }}
                          style={{ width: "100%", height: "100%", borderRadius: 15, backgroundColor: Colors[theme].cardBackground }}
                          resizeMode="cover"
                          onError={() => console.log('Failed to load postLike thumbnail:', getThumbnailUrl(item))}
                          onLoad={() => console.log('PostLike thumbnail loaded successfully:', getThumbnailUrl(item))}
                        />
                      ) : (
                        <View style={{ 
                          width: "100%", 
                          height: "100%", 
                          borderRadius: 15, 
                          backgroundColor: Colors[theme].cardBackground,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <Ionicons name="image-outline" size={48} color={Colors[theme].text} />
                          <Typography textType="secondary" style={{ marginTop: 8 }}>No image</Typography>
                        </View>
                      )}
                      {/* Show duration overlay only for videos */}
                      {item?.post?.duration && item?.post?.videoUrl && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Typography weight="500" size={12} color="#fff">
                            {formatVideoDuration(item.post.duration)}
                          </Typography>
                        </View>
                      )}
                      {/* photo icon for photos */}
                      {!item?.post?.videoUrl && (
                        <View style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 12,
                          padding: 4
                        }}>
                          <Ionicons name="image" size={16} color="white" />
                        </View>
                      )}
                      {/* play icon overlay for videos */}
                      {item?.post?.videoUrl && (
                        <View style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: [{ translateX: -16 }, { translateY: -16 }],
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 16,
                          padding: 8
                        }}>
                          <Ionicons name="play" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <Typography textType="secondary" size={13}>
                  • {formatTimePost(item?.createdAt)}
                </Typography>
                {/* Separator line */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: Colors[theme].cardBackground,
                    marginTop: 16,
                  }}
                />
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<ScrollBottomSpace />}
        />
      </View>
    </Wrapper>
  );
};

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

export default NotificationScreen;