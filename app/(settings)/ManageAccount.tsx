import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Ionicons } from '@expo/vector-icons';
import useUser from '@/hooks/profile/useUser';
import useDeactivateAccountDeletion from '@/hooks/auth/useDeactivateAccountDeletion';
import CustomAlert from '@/components/ui/CustomAlert';
import AppOtp from '@/components/ui/AppOtp';
import AppButton from '@/components/ui/AppButton';
import { useMutation } from '@tanstack/react-query';
import { verifyOTP, deleteAccountOTP } from '@/services/auth.service';
import { IVerifyOtp } from '@/helpers/types/auth/auth.types';
import { handleError } from '@/helpers/utils/handleError';
import showToast from '@/helpers/utils/showToast';

const ManageAccount = () => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { profileData, profileLoading, refetchProfile } = useUser();
  const { handleDeactivateAccountDeletion, isPending: isCanceling } = useDeactivateAccountDeletion(refetchProfile);
  
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [countDown, setCountDown] = useState(300);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const userEmail = profileData?.data?.email;
  const markedForDeletionDate = profileData?.data?.markedForDeletionDate;
  const isMarkedForDeletion = !!markedForDeletionDate;

  // Calculate days remaining
  const daysRemaining = markedForDeletionDate ? 
    Math.max(0, Math.ceil((new Date(markedForDeletionDate).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpModal && countDown > 0) {
      timer = setInterval(() => {
        setCountDown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countDown]);

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (formData: IVerifyOtp) => verifyOTP(formData),
    onSuccess: () => {
      setIsOtpVerified(true);
      setShowOtpModal(false);
      router.push('/(settings)/DeleteAccountReason');
      showToast('success', 'OTP verified successfully');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  // Delete account OTP mutation
  const deleteAccountOtpMutation = useMutation({
    mutationFn: () => deleteAccountOTP('email'),
    onSuccess: () => {
      setCountDown(300);
      showToast('success', 'OTP sent successfully');
    },
    onError: (error: any) => {
      handleError(error);
    },
  });

  const handleInitiateDelete = () => {
    setShowDeleteFlow(true);
  };

  const handleSendOtp = () => {
    if (!userEmail) return;
    
    deleteAccountOtpMutation.mutate();
    setShowOtpModal(true);
    setShowDeleteFlow(false);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 5) return;
    
    const verifyData: IVerifyOtp = {
      email: userEmail!,
      token: otp,
      type: 'email',
    };
    
    verifyOtpMutation.mutate(verifyData);
  };

  const handleResendOtp = () => {
    if (countDown > 0) return;
    
    deleteAccountOtpMutation.mutate();
  };


  const handleCancelDeletion = () => {
    handleDeactivateAccountDeletion();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  interface SettingItem {
    title: string;
    description: string;
    onPress: () => void;
    icon: string;
    variant?: 'danger' | 'primary';
  }

  const manageAccountItems: SettingItem[] = [
    // {
    //   title: 'Account Information',
    //   description: 'View and edit your account details',
    //   onPress: () => {},
    //   icon: 'person-outline',
    // },
    // {
    //   title: 'Privacy Settings',
    //   description: 'Manage your privacy preferences',
    //   onPress: () => {},
    //   icon: 'lock-closed-outline',
    // },
    // {
    //   title: 'Security',
    //   description: 'Password and security settings',
    //   onPress: () => {},
    //   icon: 'shield-outline',
    // },
    isMarkedForDeletion ? {
      title: 'Cancel Account Deletion',
      description: `Account will be deleted in ${daysRemaining} days`,
      onPress: handleCancelDeletion,
      icon: 'refresh-outline',
      variant: 'primary' as const,
    } : {
      title: 'Delete Account',
      description: 'Permanently delete your account',
      onPress: handleInitiateDelete,
      icon: 'trash-outline',
      variant: 'danger' as const,
    },
  ];

  return (
    <Wrapper>
      <View style={styles.header}>
        <BackButton />
        <Typography weight="700" size={16} color={Colors[theme].textBold}>
          Manage Account
        </Typography>
      </View>
      
      <View style={styles.container}>
        {manageAccountItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            style={[
              styles.settingItem,
            ]}
          >
            <View style={styles.settingContent}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={item.variant === 'danger' ? '#F97066' : Colors[theme].textBold} 
                style={styles.settingIcon}
              />
              <View style={styles.settingText}>
                <Typography 
                  weight="600" 
                  size={14} 
                  color={item.variant === 'danger' ? '#F97066' : Colors[theme].textBold}
                >
                  {item.title}
                </Typography>
                <Typography weight="400" size={12} color={Colors[theme].text}>
                  {item.description}
                </Typography>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={Colors[theme].text} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delete Account Confirmation */}
      <CustomAlert
        visible={showDeleteFlow}
        title="Delete Account"
        message="We'll send a verification code to your email to confirm your identity before proceeding."
        primaryButton={{
          text: "Send Code",
          onPress: handleSendOtp,
          variant: 'danger'
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => setShowDeleteFlow(false)
        }}
        onClose={() => setShowDeleteFlow(false)}
      />

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { backgroundColor: Colors[theme].cardBackground }]}>
            <Typography weight="600" size={18} color={Colors[theme].textBold} style={styles.modalTitle}>
              Verify Your Email
            </Typography>
            
            <Typography weight="400" size={14} color={Colors[theme].text} style={styles.modalSubtitle}>
              Enter the 5-digit code sent to {userEmail}
            </Typography>

            <View style={styles.otpContainer}>
              <AppOtp setCode={setOtp} />
            </View>

            <View style={styles.resendContainer}>
              <Typography weight="400" size={12} color={Colors[theme].text}>
                Didn't receive the code?
              </Typography>
              <TouchableOpacity onPress={handleResendOtp} disabled={countDown > 0}>
                <Typography 
                  weight="600" 
                  size={12} 
                  color={countDown > 0 ? Colors[theme].text : Colors.general.primary}
                >
                  {countDown > 0 ? `Resend in ${formatTime(countDown)}` : 'Resend Code'}
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <AppButton
                title="Cancel"
                handlePress={() => setShowOtpModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <AppButton
                title="Verify"
                handlePress={handleVerifyOtp}
                isLoading={verifyOtpMutation.isPending}
                disabled={otp.length !== 5}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

    </Wrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  settingItem: {
    marginBottom: 12,
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 100,
  },
});

export default ManageAccount;