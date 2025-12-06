import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Wrapper from '@/components/utilities/Wrapper';
import Typography from '@/components/ui/Typography/Typography';
import AppButton from '@/components/ui/AppButton';
import { Colors, Images } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import useDeactivateAccountDeletion from '@/hooks/auth/useDeactivateAccountDeletion';
import useAuth from '@/hooks/auth/useAuth';

interface AccountDeletionGracePeriodProps {
  markedForDeletionDate: string;
  onReactivate?: () => void;
}

const AccountDeletionGracePeriod = ({ markedForDeletionDate, onReactivate }: AccountDeletionGracePeriodProps) => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { logout } = useAuth();
  
  const [isReactivating, setIsReactivating] = useState(false);
  
  const { handleDeactivateAccountDeletion } = useDeactivateAccountDeletion(() => {
    // Refetch function - this will be called after successful reactivation
    // console.log('Account reactivated successfully');
  });

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((new Date(markedForDeletionDate).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)));

  const formatDaysRemaining = (days: number) => {
    if (days === 0) return "Less than 1 day";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const handleReactivateAccount = async () => {
    setIsReactivating(true);
    try {
      await handleDeactivateAccountDeletion();
      if (onReactivate) {
        onReactivate();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      // console.error('Failed to reactivate account:', error);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <Wrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Images.Logo 
              width={80} 
              height={80} 
              color={Colors.general.primary}
            />
          </View>

          <Typography weight="600" size={28} color={Colors[theme].textBold} style={styles.title}>
            Account Scheduled for Deletion
          </Typography>

          <Typography weight="400" size={16} color={Colors[theme].textLight} style={styles.subtitle}>
            Your account is scheduled to be permanently deleted in{' '}
            <Typography weight="600" size={16} color={Colors[theme].danger}>
              {formatDaysRemaining(daysRemaining)}
            </Typography>
          </Typography>

          <View style={[styles.warningCard, { backgroundColor: Colors[theme].warningBackground }]}>
            <Typography weight="500" size={14} color={Colors[theme].warning} style={styles.warningText}>
              ⚠️ Once deleted, all your data will be permanently lost and cannot be recovered.
            </Typography>
          </View>

          <View style={styles.infoCard}>
            <Typography weight="500" size={14} color={Colors[theme].textBold} style={styles.infoTitle}>
              What happens next?
            </Typography>
            <Typography weight="400" size={14} color={Colors[theme].textLight} style={styles.infoText}>
              • Your account is currently deactivated{'\n'}
              • You cannot post, comment, or interact with content{'\n'}
              {/* • Your profile is hidden from other users{'\n'} */}
              • All data will be permanently deleted after the grace period
            </Typography>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Reactivate Account"
            handlePress={handleReactivateAccount}
            variant="primary"
            isLoading={isReactivating}
            disabled={isReactivating}
            style={styles.primaryButton}
          />
          
          <AppButton
            title="Sign Out"
            handlePress={handleSignOut}
            variant="secondary"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 32,
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    marginBottom: 4,
  },
  secondaryButton: {
    marginTop: 4,
  },
});

export default AccountDeletionGracePeriod;