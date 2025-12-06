import React from 'react';
import { TouchableOpacity, StyleSheet, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Typography from '@/components/ui/Typography/Typography';
import { Category } from '@/helpers/types/streaming/streaming.types';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { formatNumber } from '@/helpers/utils/formatting';

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

const CategoryCard = ({ category, onPress }: CategoryCardProps) => {
  const { theme } = useCustomTheme();

  const handlePress = () => {
    onPress(category);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <ImageBackground
        source={{ uri: category.coverPhoto }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Typography size={18} weight="700" color="white" numberOfLines={2} style={styles.categoryName}>
              {category.name}
            </Typography>
            <Typography size={12} color="rgba(255,255,255,0.9)" numberOfLines={2} style={styles.description}>
              {category.description}
            </Typography>
            <View style={styles.viewCountContainer}>
              <View style={[styles.dot, { backgroundColor: Colors.general.blue }]} />
              <Typography size={10} color="rgba(255,255,255,0.8)" style={styles.viewCount}>
                {formatNumber(category.views)} watching
              </Typography>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 140,
    marginRight: 16,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 16,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    borderRadius: 16,
  },
  content: {
    padding: 10,
    alignItems: 'flex-start',
  },
  categoryName: {
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    marginBottom: 6,
    lineHeight: 16,
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  viewCount: {
    flex: 1,
  },
});

export default CategoryCard;