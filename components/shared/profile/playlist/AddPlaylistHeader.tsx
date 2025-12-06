import React from "react";
import { View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import BackButton from "@/components/utilities/BackButton";

interface AddPlaylistHeaderProps {
  title: string;
}

const AddPlaylistHeader: React.FC<AddPlaylistHeaderProps> = ({ title }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <BackButton />
        <Typography weight="700" size={18} textType="carter">
          {title}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default AddPlaylistHeader;