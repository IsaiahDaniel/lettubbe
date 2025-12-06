import Typography from "@/components/ui/Typography/Typography";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

// Memoized menu dot component to prevent recreation
export const MenuDots = memo(() => (
  <View style={styles.menuDotsStyle}>
    <Ionicons name="ellipsis-vertical" size={20} color="white" />
  </View>
));

// Memoized deleting state component
export const DeletingState = memo(() => (
  <View style={[styles.videoContainer, styles.deletingContainer]}>
    <Typography weight="500" textType="textBold" lineHeight={20}>
      Deleting post...
    </Typography>
  </View>
));

const styles = StyleSheet.create({
  videoContainer: {
    marginBottom: 24,
  },
  thumbnailContainer: {
    position: "relative",
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  menuContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  menuDotsStyle: {
    padding: 8,
    borderRadius: 12,
    // backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deletingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
});