import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Typography from './Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
    variant?: 'primary' | 'danger';
  };
  secondaryButton?: {
    text: string;
    onPress?: () => void;
  };
  onClose?: () => void;
  variant?: 'default' | 'info-only';
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  primaryButton,
  secondaryButton,
  onClose,
  variant = 'default',
}) => {
  const { theme } = useCustomTheme();

  const handleBackdropPress = () => {
    if (onClose) {
      onClose();
    }
  };

  // Auto-dismiss for info-only variant
  React.useEffect(() => {
    if (variant === 'info-only' && visible) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [variant, visible, onClose]);

  const getPrimaryButtonColor = () => {
    switch (primaryButton?.variant) {
      case 'danger':
        return '#F97066';
      case 'primary':
      default:
        return Colors.general.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.container}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.alertContainer,
              { backgroundColor: Colors[theme].cardBackground }
            ]}
          >
            <View style={styles.content}>
              <Typography
                weight="600"
                size={18}
                color={Colors[theme].textBold}
                style={styles.title}
              >
                {title}
              </Typography>
              
              <Typography
                size={16}
                color={Colors[theme].text}
                style={styles.message}
              >
                {message}
              </Typography>
            </View>

            {variant !== 'info-only' && (primaryButton || secondaryButton) && (
              <View style={styles.buttonContainer}>
                {secondaryButton && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.secondaryButton,
                      { borderColor: Colors[theme].borderColor }
                    ]}
                    onPress={secondaryButton.onPress || (() => {})}
                  >
                    <Typography
                      weight="600"
                      size={16}
                      color={Colors[theme].textBold}
                    >
                      {secondaryButton.text}
                    </Typography>
                  </TouchableOpacity>
                )}

                {primaryButton && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.primaryButton,
                      { backgroundColor: getPrimaryButtonColor() }
                    ]}
                    onPress={primaryButton.onPress}
                  >
                    <Typography
                      weight="600"
                      size={16}
                      color="white"
                    >
                      {primaryButton.text}
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.general.primary,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});

export default CustomAlert;