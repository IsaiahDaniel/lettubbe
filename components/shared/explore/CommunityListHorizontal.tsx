import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ListRenderItem,
  Dimensions,
} from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import CommunityCard from "./CommunityCard";

interface Community {
  _id: string;
  name: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  description?: string;
  topics?: string[];
  categories?: string[];
  type: "public" | "private";
  date: string;
  isSetupComplete: boolean;
  members: string[];
  approvals?: string[];
  subAdmins?: string[];
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  coverPhoto?: string;
  isJoined?: boolean;
}

interface CommunityListHorizontalProps {
  communities: Community[];
  title?: string;
  onCommunityPress?: (community: Community) => void;
  showTitle?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

const CommunityListHorizontal: React.FC<CommunityListHorizontalProps> = ({
  communities,
  title = "Communities",
  onCommunityPress,
  showTitle = true,
}) => {
  const { theme } = useCustomTheme();

  const renderCommunity: ListRenderItem<Community> = ({ item }) => (
    <CommunityCard key={`community-card-${item._id}`} community={item} onPress={onCommunityPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Typography
        color={Colors[theme].textLight}
        size={14}
        style={styles.emptyText}
      >
        No Communities found
      </Typography>
    </View>
  );

  if (!communities || communities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Typography
            textType="textBold"
            size={16}
            color={Colors[theme].text}
            style={styles.title}
          >
            {title}
          </Typography>
          <Typography
            color={Colors[theme].textLight}
            size={12}
          >
            {communities.length} {communities.length === 1 ? 'community' : 'communities'}
          </Typography>
        </View>
      )}
      
      <FlatList
        data={communities}
        renderItem={renderCommunity}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + 12, // Width of each card plus margin
          offset: (CARD_WIDTH + 12) * index,
          index,
        })}
        removeClippedSubviews={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  listContent: {
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontStyle: "italic",
  },
});

export default CommunityListHorizontal;