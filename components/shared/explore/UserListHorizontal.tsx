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
import UserCard from "./UserCard";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  description?: string;
}

interface UserListHorizontalProps {
  users: User[];
  title?: string;
  onUserPress?: (user: User) => void;
  showTitle?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

const UserListHorizontal: React.FC<UserListHorizontalProps> = ({
  users,
  title = "Channels",
  onUserPress,
  showTitle = true,
}) => {
  const { theme } = useCustomTheme();

  const renderUser: ListRenderItem<User> = ({ item }) => (
    <UserCard key={`user-card-${item._id}`} user={item} onPress={onUserPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Typography
        color={Colors[theme].textLight}
        size={14}
        style={styles.emptyText}
      >
        No Channels found
      </Typography>
    </View>
  );

  if (!users || users.length === 0) {
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
            {users.length} {users.length === 1 ? 'channel' : 'channels'}
          </Typography>
        </View>
      )}
      
      <FlatList
        data={users}
        renderItem={renderUser}
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

export default React.memo(UserListHorizontal);