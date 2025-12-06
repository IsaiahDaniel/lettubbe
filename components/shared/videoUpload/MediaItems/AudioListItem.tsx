import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Feather } from '@expo/vector-icons';
import { formatDuration, formatFileSize } from '@/helpers/utils/media-utils';

interface AudioListItemProps {
  mediaAsset: MediaLibrary.Asset;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}

export const AudioListItem: React.FC<AudioListItemProps> = ({
  mediaAsset,
  index,
  isSelected,
  onPress,
}) => {
  const { theme } = useCustomTheme();
  
  const fileName = String(mediaAsset.filename || `Audio ${index + 1}`);
  const duration = mediaAsset.duration ? Math.floor(mediaAsset.duration) : 0;
  const fileSize = mediaAsset.width || 0; // MediaLibrary sometimes stores file size in width for audio

  return (
    <TouchableOpacity
      key={String(mediaAsset.id)}
      style={[
        styles.audioListItem,
        { 
          borderColor: Colors[theme].borderColor 
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.audioItemLeft}>
        <View style={[
          styles.audioIcon,
          { backgroundColor: isSelected ? Colors.general.primary : Colors.general.purple }
        ]}>
          <Feather 
            name="music" 
            size={18} 
            color={isSelected ? 'white' : Colors[theme].text} 
          />
        </View>
        <View style={styles.audioInfo}>
          <Typography 
            size={16} 
            weight="600" 
            numberOfLines={1}
            style={{ color: Colors[theme].text }}
          >
            {String(fileName).replace(/\.[^/.]+$/, "")}
          </Typography>
          <View style={styles.audioMetadata}>
            {duration > 0 && (
              <Typography size={12} style={{ color: Colors[theme].textLight }}>
                {String(formatDuration(duration))}
              </Typography>
            )}
            {duration > 0 && fileSize > 0 && (
              <Typography size={12} style={{ color: Colors[theme].textLight }}>
                {' • '}
              </Typography>
            )}
            {fileSize > 0 && (
              <Typography size={12} style={{ color: Colors[theme].textLight }}>
                {String(formatFileSize(fileSize))}
              </Typography>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  audioListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  audioItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});