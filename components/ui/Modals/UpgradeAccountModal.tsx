import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface UpgradeAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

const UpgradeAccountModal: React.FC<UpgradeAccountModalProps> = ({ visible, onClose }) => {
  const { theme } = useCustomTheme();
  const router = useRouter();

  const handleUpgradeNow = () => {
    onClose();
    router.push("/(settings)/UpgradeAccount");
  };

  const handleRemindLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {/* Background Overlay */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <BlurView intensity={20} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurContainer}>
          {/* Modal Content */}
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContainer, { backgroundColor: Colors[theme].cardBackground }]}
          >
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Typography size={24} textType="secondary">×</Typography>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.badgeContainer}>
                <Image source={Icons.badge} style={styles.badgeIcon} />
                <View style={styles.sparkle1} />
                <View style={styles.sparkle2} />
                <View style={styles.sparkle3} />
              </View>
              
              <Typography weight="700" size={22} color={Colors[theme].textBold}>
                Unlock Premium Features!
              </Typography>
              
              <Typography weight="400" size={14} textType="secondary" style={styles.subtitle}>
                Exclusive perks to boost your vibe.
              </Typography>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <View style={styles.checkIcon} />
                <Typography weight="500" size={14}>
                  Verified badge on your profile
                </Typography>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.checkIcon} />
                <Typography weight="500" size={14}>
                  Access to Lettubbe Studio
                </Typography>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.checkIcon} />
                <Typography weight="500" size={14}>
                  Enhanced profile visibility
                </Typography>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.checkIcon} />
                <Typography weight="500" size={14}>
                  Priority support access
                </Typography>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <AppButton
                title="Upgrade Now"
                handlePress={handleUpgradeNow}
                variant="primary"
                style={styles.upgradeButton}
              />
              
              <TouchableOpacity 
                onPress={handleRemindLater}
                style={styles.laterButton}
              >
                <Typography weight="500" size={14} textType="secondary">
                  Maybe Later
                </Typography>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: Math.min(screenWidth - 40, 340),
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    tintColor: '#AAB8C2',
  },
  sparkle1: {
    position: 'absolute',
    top: -8,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    opacity: 0.8,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -4,
    left: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    opacity: 0.7,
  },
  sparkle3: {
    position: 'absolute',
    top: 8,
    left: -12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
    opacity: 0.6,
  },
  subtitle: {
    marginTop: 8,
  },
  benefitsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#52C41A',
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1890FF',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16
  },
  upgradeButton: {
    marginBottom: 0,
  },
  laterButton: {
    paddingTop: 12,
  },
});

export default UpgradeAccountModal;