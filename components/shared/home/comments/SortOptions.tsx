import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { SortOption } from "@/helpers/types/comments/Types";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface SortOptionsProps {
  sortOptions: SortOption[];
  selectedSort: string;
  onSortChange: (option: SortOption) => void;
}

const SortOptions: React.FC<SortOptionsProps> = ({
  sortOptions,
  selectedSort,
  onSortChange,
}) => {
  const { theme } = useCustomTheme();

  const renderSortOption = ({ item }: { item: SortOption }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        { backgroundColor: Colors[theme].cardBackground },
        selectedSort === item.name && styles.selectedSort,
      ]}
      onPress={() => onSortChange(item)}
    >
      <Typography
        weight="400"
        size={11}
        lineHeight={13}
        style={[
          selectedSort === item.name && styles.selectedSortText,
        ]}
      >
        {item.name}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.sortContainer}>
      <FlatList
        data={sortOptions}
        renderItem={renderSortOption}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: "row",
    paddingBottom: 15,
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortButton: {
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  selectedSort: {
    backgroundColor: Colors.general.primary,
  },
  selectedSortText: {
  },
});

export default SortOptions;
