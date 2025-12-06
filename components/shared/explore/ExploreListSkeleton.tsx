import React from "react";
import { View, StyleSheet } from "react-native";
import ExploreCardSkeleton from "./ExploreCardSkeleton";

interface ExploreListSkeletonProps {
  count?: number;
}

const ExploreListSkeleton: React.FC<ExploreListSkeletonProps> = ({ count = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <ExploreCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Match the sectionList styling from ExploreContent
  },
});

export default ExploreListSkeleton;