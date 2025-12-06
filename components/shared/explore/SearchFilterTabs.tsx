import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";

export type SearchFilterType = "top" | "latest" | "channels" | "communities" | "posts";

interface SearchFilterTabsProps {
  activeFilter: SearchFilterType;
  onFilterChange: (filter: SearchFilterType) => void;
  resultCounts?: {
    channels?: number;
    communities?: number;
    posts?: number;
  };
}

const filterLabels: Record<SearchFilterType, string> = {
  top: "Top",
  latest: "Latest", 
  channels: "Channels",
  communities: "Communities",
  posts: "Posts",
};

const SearchFilterTabs: React.FC<SearchFilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  resultCounts = {},
}) => {
  const { theme } = useCustomTheme();

  const getTabLabel = (filter: SearchFilterType) => {
    return filterLabels[filter];
  };

  const renderTab = (filter: SearchFilterType) => {
    const isActive = activeFilter === filter;
    
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.tab,
          {
            backgroundColor: isActive 
              ? Colors.general.primary 
              : Colors[theme].cardBackground,
            borderColor: isActive 
              ? Colors.general.primary 
              : Colors[theme].borderColor,
          },
        ]}
        onPress={() => onFilterChange(filter)}
        activeOpacity={0.7}
      >
        <Typography
          size={14}
          weight={isActive ? "600" : "500"}
          color={isActive ? "#fff" : Colors[theme].text}
        >
          {getTabLabel(filter)}
        </Typography>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderTab("top")}
        {renderTab("latest")}
        {renderTab("channels")}
        {renderTab("communities")}
        {renderTab("posts")}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    // minWidth: 80,
  },
});

export default SearchFilterTabs;