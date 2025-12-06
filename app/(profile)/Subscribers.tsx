import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Avatar from "@/components/ui/Avatar";
import useSubscription from "@/hooks/profile/useSubscription";
import { getPublicProfile } from "@/services/profile.service";
import { useSubscribersInfinite, useSubscriptionsInfinite } from "@/hooks/profile/useSubscribersInfinite";
import BackButton from "@/components/utilities/BackButton";
import Wrapper from "@/components/utilities/Wrapper";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";
import useAuth from "@/hooks/auth/useAuth";

type TabType = "subscribers" | "subscribed";

interface UserItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isSubscribed: boolean;
  isSkeleton?: boolean;
}

interface SubscriptionItem {
  _id: string;
  subscriber: string;
  subscribedTo: string | {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    data: SubscriptionItem[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

const Subscribers = () => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { userId, initialTab } = useLocalSearchParams<{
    userId?: string;
    initialTab?: string;
  }>();

  const [activeTab, setActiveTab] = useState<TabType>(
    initialTab === "subscribed" ? "subscribed" : "subscribers"
  );
  
  // State for UserProfileBottomSheet
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // State for fetched user details
  const [userDetailsCache, setUserDetailsCache] = useState<Record<string, UserItem>>({});
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());

  // Infinite queries
  const subscribersQuery = useSubscribersInfinite(userId);
  const subscriptionsQuery = useSubscriptionsInfinite(userId);

  const currentQuery = activeTab === "subscribers" ? subscribersQuery : subscriptionsQuery;

  // Clear cache when tab changes
  useEffect(() => {
    setUserDetailsCache({});
    setLoadingUserIds(new Set());
  }, [activeTab]);

  // Function to fetch user details for IDs
  const fetchUserDetails = async (userIds: string[]) => {
    const newIds = userIds.filter(id => !userDetailsCache[id] && !loadingUserIds.has(id));
    if (newIds.length === 0) return;

    // Mark these IDs as loading
    setLoadingUserIds(prev => new Set([...prev, ...newIds]));

    try {
      const promises = newIds.map(async (id) => {
        try {
          const response = await getPublicProfile(id);
          if (response.success && response.data) {
            const userData = response.data;
            return {
              id: userData._id,
              username: userData.username || 'unknown',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              profilePicture: userData.profilePicture,
              isSubscribed: false
            };
          }
        } catch (error) {
          console.error(`Failed to fetch user ${id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean) as UserItem[];

      if (validResults.length > 0) {
        setUserDetailsCache(prev => {
          const updated = { ...prev };
          validResults.forEach(user => {
            updated[user.id] = user;
          });
          return updated;
        });
      }
    } finally {
      // Remove from loading set
      setLoadingUserIds(prev => {
        const updated = new Set(prev);
        newIds.forEach(id => updated.delete(id));
        return updated;
      });
    }
  };

  // Transform paginated data into flat array
  const users = useMemo(() => {
    if (!currentQuery.data?.pages) {
      console.log('No pages data available');
      return [];
    }
    
    console.log(`${activeTab} - Pages count:`, currentQuery.data.pages.length);
    
    const allUsers: UserItem[] = [];
    const userIdsToFetch: string[] = [];
    
    currentQuery.data.pages.forEach((page, pageIndex) => {
      console.log(`Page ${pageIndex}:`, page);
      if (page?.success && page.data?.data) {
        const subscriptionData = page.data.data as SubscriptionItem[];
        console.log(`Page ${pageIndex} subscription data:`, subscriptionData.length, 'items');
        
        if (activeTab === "subscribed") {
          // For "subscribed to" user data is already populated in the response
          const userProfiles: UserItem[] = subscriptionData.map((item: SubscriptionItem) => {
            const userData = item.subscribedTo as {
              _id: string;
              firstName: string;
              lastName: string;
              username: string;
              profilePicture?: string;
            };
            return {
              id: userData._id,
              username: userData.username || 'unknown',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              profilePicture: userData.profilePicture,
              isSubscribed: true
            };
          });
          allUsers.push(...userProfiles);
        } else {
          // For subscribers, check if subscriber data is populated or just an ID
          const userProfiles: UserItem[] = subscriptionData.map((item: SubscriptionItem) => {
            // Check if subscriber is an object (populated) or just a string (ID only)
            if (typeof item.subscriber === 'object' && item.subscriber !== null) {
              // Subscriber data is populated
              const userData = item.subscriber as {
                _id: string;
                firstName: string;
                lastName: string;
                username: string;
                profilePicture?: string;
              };
              return {
                id: userData._id,
                username: userData.username || 'unknown',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                profilePicture: userData.profilePicture,
                isSubscribed: false
              };
            } else {
              // Subscriber data is just an ID - check cache or fetch
              const subscriberId = item.subscriber as string;
              
              if (userDetailsCache[subscriberId]) {
                // Use cached data
                return userDetailsCache[subscriberId];
              } else {
                // Add to fetch list
                userIdsToFetch.push(subscriberId);
                
                // Return skeleton placeholder
                return {
                  id: subscriberId,
                  username: '████████', // Skeleton placeholder
                  firstName: '██████',
                  lastName: '',
                  profilePicture: undefined,
                  isSubscribed: false,
                  isSkeleton: true
                };
              }
            }
          });
          allUsers.push(...userProfiles);
        }
      }
    });
    
    // Fetch missing user details
    if (userIdsToFetch.length > 0) {
      fetchUserDetails(userIdsToFetch);
    }
    
    console.log(`${activeTab} - Total users:`, allUsers.length);
    return allUsers;
  }, [currentQuery.data?.pages, activeTab, userDetailsCache, loadingUserIds]);

  const handleLoadMore = () => {
    console.log('handleLoadMore called');
    console.log('hasNextPage:', currentQuery.hasNextPage);
    console.log('isFetchingNextPage:', currentQuery.isFetchingNextPage);
    
    if (currentQuery.hasNextPage && !currentQuery.isFetchingNextPage) {
      console.log('Fetching next page...');
      currentQuery.fetchNextPage();
    } else {
      console.log('Not fetching - no next page or already fetching');
    }
  };

  // user item press
  const handleUserItemPress = (userId: string) => {
    if (userId === userDetails?._id) {
      // Navigate to own profile
      router.push("/(tabs)/profile");
    } else {
      // Open user profile bottom sheet
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  // Handle closing user profile bottom sheet
  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    // Delayed cleanup to allow animation
    setTimeout(() => setSelectedUserId(null), 300);
  };

  // a separate component for user items to properly use hooks
  const UserItemComponent = ({ item }: { item: UserItem }) => {
    const { handleSubscribe, handleUnsubscribe, isSubscribed, isLoading } =
      useSubscription({
        initialIsSubscribed: item.isSubscribed,
      });

    // Format full name
    const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.username || 'Unknown User';

    if (item.isSkeleton) {
      return (
        <View style={[styles.userItem, {borderBottomColor: Colors[theme].cardBackground}]}>
          <View style={styles.userInfo}>
            <View style={[styles.skeletonAvatar, {backgroundColor: Colors[theme].cardBackground}]} />
            <View style={styles.userTextInfo}>
              <View style={[styles.skeletonText, styles.skeletonTextLarge, {backgroundColor: Colors[theme].cardBackground}]} />
              <View style={[styles.skeletonText, styles.skeletonTextSmall, {backgroundColor: Colors[theme].cardBackground}]} />
            </View>
          </View>
          {activeTab === "subscribers" && userId && (
            <View style={[styles.skeletonButton, {backgroundColor: Colors[theme].cardBackground}]} />
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.userItem, {borderBottomColor: Colors[theme].cardBackground,}]}
        onPress={() => handleUserItemPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userInfo}>
          <Avatar
            imageSource={item.profilePicture}
            alt={fullName}
            size={45}
            uri={!!item.profilePicture}
            ringColor= {Colors[theme].avatar}
          />
          <View style={styles.userTextInfo}>
            <Typography style={styles.userName}>{fullName}</Typography>
            {item.username && fullName !== item.username && (
              <Typography style={styles.userHandle}>@{item.username}</Typography>
            )}
          </View>
        </View>

        {activeTab === "subscribers" && userId && (
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isSubscribed ? styles.subscribedButton : {},
            ]}
            onPress={(e) => {
              // Prevent triggering the parent TouchableOpacity
              e.stopPropagation();
              
              if (isSubscribed) {
                handleUnsubscribe(item.id);
              } else {
                handleSubscribe(item.id);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.general.primary} />
            ) : (
              <Typography
                size={12}
                color={
                  isSubscribed ? Colors[theme].text : Colors.general.primary
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Typography>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }: { item: UserItem }) => {
    return <UserItemComponent item={item} />;
  };

  return (
    <Wrapper>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
        <BackButton />
        <Typography weight="600" textType="carter" size={18}>
          Subs
        </Typography>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "subscribers"
              ? { borderBottomColor: Colors[theme].text }
              : {},
          ]}
          onPress={() => setActiveTab("subscribers")}
        >
          <Typography
            weight={activeTab === "subscribers" ? "600" : "400"}
            color={
              activeTab === "subscribers" ? Colors[theme].text : Colors[theme].textLight
            }
          >
            Subscribers
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "subscribed"
              ? { borderBottomColor: Colors[theme].text }
              : {},
          ]}
          onPress={() => setActiveTab("subscribed")}
        >
          <Typography
            weight={activeTab === "subscribed" ? "600" : "400"}
            color={
              activeTab === "subscribed" ? Colors[theme].text : Colors[theme].textLight
            }
          >
            Subscribed to
          </Typography>
        </TouchableOpacity>
      </View>

      {/* User List */}
      {currentQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.general.primary} />
        </View>
      ) : currentQuery.isError ? (
        <View style={styles.centered}>
          <Typography>An error occurred while loading data</Typography>
          <TouchableOpacity style={styles.retryButton} onPress={() => currentQuery.refetch()}>
            <Typography color={Colors.general.primary}>Retry</Typography>
          </TouchableOpacity>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centered}>
          <Typography>
            {activeTab === "subscribers"
              ? "No subscribers yet"
              : "Not subscribed to anyone yet"}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => `${activeTab}-${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => 
            currentQuery.isFetchingNextPage ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={Colors.general.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* UserProfileBottomSheet */}
      <UserProfileBottomSheet
        isVisible={showUserProfile}
        onClose={handleCloseUserProfile}
        userId={selectedUserId || undefined}
      />
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 5,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  listContent: {
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 12,
    opacity: 0.7,
  },
  subscribeButton: {
    backgroundColor: Colors.general.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subscribedButton: {
    backgroundColor: "#E5E5E5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    opacity: 0.3,
  },
  skeletonText: {
    height: 12,
    borderRadius: 6,
    opacity: 0.3,
  },
  skeletonTextLarge: {
    width: 120,
    marginBottom: 6,
  },
  skeletonTextSmall: {
    width: 80,
  },
  skeletonButton: {
    width: 80,
    height: 28,
    borderRadius: 14,
    opacity: 0.3,
  },
});

export default Subscribers;