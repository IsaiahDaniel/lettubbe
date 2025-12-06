import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import Typography from '@/components/ui/Typography/Typography';
import AppButton from '@/components/ui/AppButton';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import useDeleteAccount from '@/hooks/auth/useDeleteAccount';
import showToast from '@/helpers/utils/showToast';

const DeleteAccountReason = () => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { reasonText, setReasonText, handleDeleteAccount, isPending } = useDeleteAccount();

  const handleSubmit = () => {
    handleDeleteAccount();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Wrapper>
      <View style={styles.container}>
        <BackButton handlePress={() => router.back()} />

        <View style={styles.content}>
          <View>
            <Typography weight="600" size={20} color={Colors[theme].textBold} style={styles.title}>
              Tell us why you're leaving
            </Typography>

            <Typography weight="400" size={14} color={Colors[theme].textLight} style={styles.subtitle}>
              Your feedback helps us improve our service. This step is optional.
            </Typography>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: Colors[theme].cardBackground,
                  borderColor: Colors[theme].borderColor,
                  color: Colors[theme].textBold
                }
              ]}
              placeholder="Tell us why you're deleting your account..."
              placeholderTextColor={Colors[theme].textLight}
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <AppButton
              title="Cancel"
              handlePress={handleCancel}
              variant="secondary"
              isLoading={false}
              disabled={isPending}
              style={styles.skipButton}
            />

            <AppButton
              title="Delete Account"
              handlePress={handleSubmit}
              variant="danger"
              isLoading={isPending}
              disabled={isPending}
              style={styles.deleteButton}
            />
          </View>
        </View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});

export default DeleteAccountReason;