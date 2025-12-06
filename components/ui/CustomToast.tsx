import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ToastProps } from 'react-native-toast-message';
import Typography from './Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface CustomToastProps extends ToastProps {
  variant?: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
}

const CustomToast: React.FC<CustomToastProps> = ({ text1, text2, variant = 'info' }) => {
  const { theme } = useCustomTheme();

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return Colors.general.primary;
      case 'error':
        return Colors.general.error;
      default:
        return Colors[theme].textLight;
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: Colors[theme].cardBackground }
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
        <Typography 
          size={16} 
          weight="600" 
          color={getIconColor()}
          style={styles.icon}
        >
          {getIcon()}
        </Typography>
      </View>
      
      <View style={styles.textContainer}>
        {text1 && (
          <Typography 
            size={14} 
            weight="600" 
            color={Colors[theme].textBold}
          >
            {text1}
          </Typography>
        )}
        {text2 && (
          <Typography 
            size={13} 
            color={Colors[theme].text}
            style={text1 ? styles.subtitle : undefined}
          >
            {text2}
          </Typography>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    lineHeight: 18,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
});

export default CustomToast;