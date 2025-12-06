import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { getSignupState, clearSignupState } from '@/helpers/utils/signupState';

interface SignupRecoveryBannerProps {
  onDismiss?: () => void;
}

const SignupRecoveryBanner: React.FC<SignupRecoveryBannerProps> = ({ onDismiss }) => {
  const { theme } = useCustomTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>('');

  useEffect(() => {
    checkForRecovery();
  }, []);

  const checkForRecovery = async () => {
    const signupState = await getSignupState();
    if (signupState && signupState.step !== 'completed') {
      setShowBanner(true);
      setSignupEmail(signupState.email || signupState.phone || '');
    }
  };

  const handleDismiss = async () => {
    setShowBanner(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleClearSignup = async () => {
    await clearSignupState();
    setShowBanner(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: Colors.general.primary + '15', borderColor: Colors.general.primary + '30' }]}>
      <View style={styles.content}>
        <Ionicons name="information-circle" size={20} color={Colors.general.primary} />
        <View style={styles.textContainer}>
          <Typography weight="500" size={14} color={Colors[theme].textBold}>
            Continue your signup
          </Typography>
          <Typography size={12} color={Colors[theme].textLight}>
            Resume creating your account for {signupEmail}
          </Typography>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleClearSignup} style={styles.actionButton}>
          <Typography size={12} color={Colors[theme].textLight}>
            Start Over
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color={Colors[theme].textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissButton: {
    padding: 4,
  },
});

export default SignupRecoveryBanner;