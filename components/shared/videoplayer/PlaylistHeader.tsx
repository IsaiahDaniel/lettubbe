import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface PlaylistHeaderProps {
  playlistData: any;
  currentIndex: number;
  totalVideos: number;
  onPress: () => void;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
  playlistData,
  currentIndex,
  totalVideos,
  onPress,
}) => {
  const { theme } = useCustomTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: Colors[theme].cardBackground },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.infoRow}>
        <Ionicons
          name="list"
          size={20}
          color={Colors[theme].textBold}
        />
        <View style={styles.textInfo}>
          <Typography
            weight="600"
            size={14}
            color={Colors[theme].textBold}
          >
            {playlistData?.data?.name || 'Playlist'}
          </Typography>
          <Typography
            weight="400"
            size={12}
            color={Colors[theme].textLight}
          >
            {currentIndex + 1} of {totalVideos}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInfo: {
    flex: 1,
    marginLeft: 4,
  },
});

export default PlaylistHeader;