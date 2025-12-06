import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Post } from "@/helpers/types/explore/explore";
import ExploreCard from "./ExploreCard";
import ExploreListSkeleton from "./ExploreListSkeleton";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import { useExploreSections } from "@/hooks/explore/useExploreSections";
import NetworkError from "@/components/shared/NetworkError";

interface ExploreContentProps {
  onPostPress: (post: Post) => void;
  syncInteractions?: {
    syncLikedPosts: (posts: any[]) => void;
    syncBookmarkedPosts: (posts: any[]) => void;
  };
}

interface SectionHeaderProps {
  title: string;
  onViewAll: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll }) => {
  const { theme } = useCustomTheme();
  
  return (
    <View style={styles.sectionHeader}>
      <Typography weight="600" size={18} textType="textBold">
        {title}
      </Typography>
      <TouchableOpacity onPress={onViewAll}>
        <Typography size={14} color={Colors.general.primary}>
          View all
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

interface SectionListProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  isLoading: boolean;
}

const SectionList: React.FC<SectionListProps> = ({ posts, onPostPress, isLoading }) => {
  if (isLoading) {
    return <ExploreListSkeleton count={3} />;
  }

  const displayPosts = posts.slice(0, 3); // Show only first 3 items

  return (
    <View style={styles.sectionList}>
      {displayPosts.map((post, index) => (
        <ExploreCard
          key={post.id}
          item={post}
          onPress={() => onPostPress(post)}
        />
      ))}
    </View>
  );
};

const ExploreContent: React.FC<ExploreContentProps> = ({ onPostPress, syncInteractions }) => {
  const { posts, loading, handleRefresh, refreshing, errors, refetch } = useExploreSections();

  // Sync posts with global interaction state when data loads
  const hasSyncedRef = React.useRef(false);
  const lastPostCountsRef = React.useRef({ trending: 0, popular: 0, forYou: 0 });
  
  // Cleanup refs on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => {
      hasSyncedRef.current = false;
      lastPostCountsRef.current = { trending: 0, popular: 0, forYou: 0 };
    };
  }, []);
  
  React.useEffect(() => {
    const currentCounts = {
      trending: posts.trending.length,
      popular: posts.popular.length,
      forYou: posts.forYou.length
    };
    
    const hasNewData = 
      currentCounts.trending !== lastPostCountsRef.current.trending ||
      currentCounts.popular !== lastPostCountsRef.current.popular ||
      currentCounts.forYou !== lastPostCountsRef.current.forYou;
    
    if (syncInteractions && hasNewData && (currentCounts.trending > 0 || currentCounts.popular > 0 || currentCounts.forYou > 0)) {
      const allPosts = [...posts.trending, ...posts.popular, ...posts.forYou];
      const videoData = allPosts.map(post => ({
        _id: post.id,
        reactions: {
          likes: (() => {
            // Create array with correct length for sync
            const likesArray = new Array(post.likes).fill(null).map((_, i) => `like-${post.id}-${i}`);
            // If user liked it, replace first entry with their ID
            if (post.isLiked) {
              likesArray[0] = 'current_user';
            }
            return likesArray;
          })(),
        },
        isBookmarked: post.isSaved || false,
      }));
      
      syncInteractions.syncLikedPosts(videoData);
      syncInteractions.syncBookmarkedPosts(videoData);
      
      lastPostCountsRef.current = currentCounts;
      hasSyncedRef.current = true;
    }
  }, [posts.trending.length, posts.popular.length, posts.forYou.length, syncInteractions]);

  const handleViewAll = (section: string) => {
    router.push({
      pathname: "/(explore)/section",
      params: { section }
    });
  };

  const onRefresh = () => {
    handleRefresh('trending');
    handleRefresh('popular');
    handleRefresh('forYou');
  };

  // Check if all sections have errors
  const hasErrors = errors.trending || errors.popular || errors.forYou;
  const allSectionsHaveErrors = errors.trending && errors.popular && errors.forYou;

  // If all sections failed to load, show error screen
  const renderContent = () => {
    if (allSectionsHaveErrors) {
      return (
        <NetworkError
          error={errors.trending || errors.popular || errors.forYou}
          refetch={() => {
            refetch('trending');
            refetch('popular');
            refetch('forYou');
          }}
        />
      );
    }

    return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing.trending || refreshing.popular || refreshing.forYou}
          onRefresh={onRefresh}
          tintColor={Colors.general.primary}
        />
      }
    >
      {/* Trending Section - only show if has content or is loading */}
      {(posts.trending.length > 0 || loading.trending) && (
        <View style={styles.section}>
          <SectionHeader 
            title="Trending" 
            onViewAll={() => handleViewAll("trending")} 
          />
          <SectionList 
            posts={posts.trending}
            onPostPress={onPostPress}
            isLoading={loading.trending}
          />
        </View>
      )}

      {/* Popular Section - only show if has content or is loading */}
      {(posts.popular.length > 0 || loading.popular) && (
        <View style={styles.section}>
          <SectionHeader 
            title="Popular" 
            onViewAll={() => handleViewAll("popular")} 
          />
          <SectionList 
            posts={posts.popular}
            onPostPress={onPostPress}
            isLoading={loading.popular}
          />
        </View>
      )}

      {/* For You Section - only show if has content or is loading */}
      {/* {(posts.forYou.length > 0 || loading.forYou) && (
        <View style={styles.section}>
          <SectionHeader 
            title="For You" 
            onViewAll={() => handleViewAll("forYou")} 
          />
          <SectionList 
            posts={posts.forYou}
            onPostPress={onPostPress}
            isLoading={loading.forYou}
          />
        </View>
      )} */}

      {/* Bottom spacing */}
      <View style={styles.bottomSpace} />
    </ScrollView>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16
  },
  section: {
    marginVertical: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionList: {
  },
  bottomSpace: {
    height: 100,
  },
});

export default ExploreContent;
