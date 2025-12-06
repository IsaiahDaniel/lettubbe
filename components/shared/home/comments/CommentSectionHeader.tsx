import React from "react";
import { View, StyleSheet } from "react-native";
import SortOptions from "./SortOptions";
import { SortOption } from "@/helpers/types/comments/Types";

interface CommentSectionHeaderProps {
  sortOptions: SortOption[];
  selectedSort: string;
  onSortChange: (option: SortOption) => void;
}

const CommentSectionHeader: React.FC<CommentSectionHeaderProps> = ({
  sortOptions,
  selectedSort,
  onSortChange,
}) => {
  return (
    <View style={styles.headerContainer}>
      <SortOptions 
        sortOptions={sortOptions} 
        selectedSort={selectedSort} 
        onSortChange={onSortChange} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    marginTop: 16
  },
});

export default CommentSectionHeader;