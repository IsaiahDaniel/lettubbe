import React from "react";
import { View, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Post } from "@/helpers/types/explore/explore";
import ExploreCard from "@/components/shared/explore/ExploreCard";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import ScrollAwareFlatList from "@/components/ui/ScrollAwareFlatList";

interface PopularSectionProps {
  onPostPress: (post: Post) => void;
  popularPosts: Post[];
  isLoading: boolean;
  refreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
}

const PopularSection: React.FC<PopularSectionProps> = ({
  onPostPress,
  popularPosts,
  isLoading,
  refreshing,
  error,
  handleRefresh,
}) => {
  const { theme } = useCustomTheme();

  // post item
  const renderItem = ({ item }: { item: Post }) => (
    <ExploreCard
      item={item}
      onPress={onPostPress}
    />
  );

  // loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typography color={Colors.general.error} size={14}>
          {error}
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollAwareFlatList
        data={popularPosts}
        renderItem={renderItem}
        keyExtractor={(item: Post) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography color={Colors[theme].textLight} size={14}>
              No popular videos available right now
            </Typography>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
});

export default PopularSection;
