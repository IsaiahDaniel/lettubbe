import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors, Icons } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Feather } from '@expo/vector-icons';

interface UploadMainMenuProps {
  onVideoPress: () => void;
  onPhotoPress: () => void;
}

export const UploadMainMenu: React.FC<UploadMainMenuProps> = ({
  onVideoPress,
  onPhotoPress,
}) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity style={styles.optionCard} onPress={onVideoPress}>
        <Image
          source={Icons.play}
          style={[styles.optionIcon, { tintColor: Colors.general.blueBrand }]}
          resizeMode="contain"
        />
        <Typography size={16} weight="600">
          New Video
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionCard} onPress={onPhotoPress}>
        <Image
          source={Icons.photo}
          style={[styles.optionIcon, { tintColor: Colors.general.blueBrand }]}
          resizeMode="contain"
        />
        <Typography size={16} weight="600">
          New Photo
        </Typography>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.optionCard}>
        <Image
          source={Icons.live}
          style={[styles.optionIcon, { tintColor: Colors.general.live }]}
          resizeMode="contain"
        />
        <Typography size={16} weight="600">
          Go live
        </Typography>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    paddingVertical: 20,
    paddingHorizontal: 36,
    gap: 59,
  },
  optionCard: {
    width: 120,
    height: 120,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  optionIcon: {
    width: 50,
    height: 50,
  },
});