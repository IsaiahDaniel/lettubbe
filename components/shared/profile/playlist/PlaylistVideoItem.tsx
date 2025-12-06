import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { Post } from "@/helpers/types/explore/explore";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { formatPlays } from "@/helpers/utils/videoUtils";

interface PlaylistVideoItemProps {
  item: Post;
  onPostPress: (post: Post) => void;
  onAddToPlaylist: (post: Post) => void;
  isAdded: boolean;
  isLoading: boolean;
}

const PlaylistVideoItem: React.FC<PlaylistVideoItemProps> = ({
  item,
  onPostPress,
  onAddToPlaylist,
  isAdded,
  isLoading,
}) => {
  const { theme } = useCustomTheme();

  // Format duration in seconds to MM:SS
  const formatDuration = (durationInSeconds: number): string => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.searchResultItem}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => onPostPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnail}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumbnailPlaceholder,
                  { backgroundColor: Colors[theme].cardBackground },
                ]}
              />
            )}
            {item.duration > 0 && (
              <View style={styles.durationBadge}>
                <Typography size={10} weight="500" style={{ color: "#FFF" }}>
                  {formatDuration(item.duration)}
                </Typography>
              </View>
            )}
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Typography
            numberOfLines={2}
            weight="600"
            size={14}
            textType="textBold"
          >
            {item.description || "Untitled Video"}
          </Typography>

          <View style={styles.itemMeta}>
            <Typography
              numberOfLines={1}
              size={12}
              color={Colors[theme].textLight}
            >
              {item.user.fullName ||
                `${item.user.firstName} ${item.user.lastName}`}
            </Typography>
            {/* <Typography size={12} color={Colors[theme].textLight} style={{marginLeft: 8}}>
                • {formatPlays(item.plays)} plays
              </Typography> */}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, isAdded && styles.addedButton]}
        onPress={() => onAddToPlaylist(item)}
        disabled={isAdded || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons
            name={isAdded ? "checkmark" : "add"}
            size={18}
            color={isAdded ? "#22c55e" : "#0066ff"}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
  },
  thumbnailContainer: {
    width: 120,
    height: 70,
    marginRight: 12,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "rgba(0, 102, 255, 0.1)",
  },
  addedButton: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "#22c55e",
  },
});

export default PlaylistVideoItem;
