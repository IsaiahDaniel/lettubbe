import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  customStyle?: object;
}

const EmptyState = ({ title, subtitle, image, customStyle }: EmptyStateProps) => {
  const { theme } = useCustomTheme();
  
  return (
    <View style={[styles.emptyState, customStyle]}>
      {image && (
        <Image 
          source={image} 
          style={styles.image}
          resizeMode="contain"
        />
      )}
      <Typography 
        size={18} 
        weight="600" 
        color={Colors[theme].text}
        style={styles.title}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography 
          size={14} 
          color={Colors[theme].textLight}
          style={styles.subtitle}
        >
          {subtitle}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: '80%',
  }
});

export default EmptyState;