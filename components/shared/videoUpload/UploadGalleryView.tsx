import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Feather } from '@expo/vector-icons';
import RemixIcon from 'react-native-remix-icon';
import MediaGalleryPicker from './MediaGalleryPicker';

type Album = {
  id: string;
  title: string;
  assetCount?: number;
  totalAssetCount?: number;
};

interface UploadGalleryViewProps {
  selectedAlbum: Album | null;
  onAlbumSelectorPress: () => void;
  onClose: () => void;
}

export const UploadGalleryView: React.FC<UploadGalleryViewProps> = ({
  selectedAlbum,
  onAlbumSelectorPress,
  onClose,
}) => {
  const { theme } = useCustomTheme();
  const albumSelectorRef = useRef<View>(null);

  return (
    <View style={styles.container}>
      {selectedAlbum && (
        <>
          <View style={styles.customHeaderContainer}>
            <View style={styles.centerTitleContainer}>
              <TouchableOpacity
                ref={albumSelectorRef}
                style={styles.albumSelector}
                onPress={onAlbumSelectorPress}
              >
                <Typography weight="600" size={16} textType="textBold">
                  {selectedAlbum.title}
                </Typography>
                <Feather
                  name="chevron-down"
                  size={24}
                  color={Colors[theme].textBold}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeIconContainer}
              onPress={onClose}
            >
              <RemixIcon
                name="close-line"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>
          </View>
          <MediaGalleryPicker selectedAlbum={selectedAlbum} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  customHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    marginHorizontal: 16,
    paddingHorizontal: 4,
  },
  centerTitleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  closeIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  albumSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});