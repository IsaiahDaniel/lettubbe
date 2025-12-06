import React from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import Wrapper from "@/components/utilities/Wrapper";
import BackButton from "@/components/utilities/BackButton";
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import showToast from "@/helpers/utils/showToast";

const UpgradeAccount = () => {
  const { theme } = useCustomTheme();
  const router = useRouter();

  const walletAddress = "@lettubbeonline";

  const handleCopyWallet = async () => {
    try {
      await Clipboard.setStringAsync(walletAddress);
      showToast("success", "Wallet address copied to clipboard");
    } catch (error) {
      showToast("error", "Failed to copy wallet address");
    }
  };

  const handleContactSupport = () => {
    // Navigate to chat with lettubbe support account
    const supportUserId = "6824061e4f0f424f735110b5";
    const supportUsername = "lettubbesupport";
    const supportDisplayName = "lettube app";
    const supportAvatar = "https://lettubbe-production.s3.eu-north-1.amazonaws.com/profilePicture/6824061e4f0f424f735110b5/09a14570-25c2-4961-a36a-c0731704c0be.60bf4212-e570-481e-9716-d0f4f5d4e95e";
    
    router.push(`/(chat)/${supportUserId}/Inbox?username=${supportUsername}&displayName=${supportDisplayName}&userId=${supportUserId}&avatar=${supportAvatar}`);
  };

  return (
    <Wrapper>
      <BackButton />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={Icons.badge} style={styles.badgeIcon} />
          <Typography weight="700" size={24} color={Colors[theme].textBold}>
            Upgrade Your Account
          </Typography>
          <Typography weight="400" size={16} textType="secondary" style={styles.subtitle}>
            Get premium features and enhanced visibility
          </Typography>
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsCard, { backgroundColor: Colors[theme].cardBackground }]}>
          <Typography weight="600" size={18} color={Colors[theme].textBold} style={styles.sectionTitle}>
            Premium Benefits
          </Typography>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Verification badge on your profile
              </Typography>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Access to Lettubbe Studio at lettubbe.online
              </Typography>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Enhanced stream visibility
              </Typography>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Enhanced profile visibility
              </Typography>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Priority support
              </Typography>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkmark} />
              <Typography weight="400" size={14}>
                Exclusive premium features
              </Typography>
            </View>
          </View>
        </View>

        {/* Instructions Section */}
        <View style={[styles.instructionsCard, { backgroundColor: Colors[theme].cardBackground }]}>
          <Typography weight="600" size={18} color={Colors[theme].textBold} style={styles.sectionTitle}>
            How to Upgrade
          </Typography>
          
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography weight="600" size={12} color="#fff">1</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography weight="500" size={14} color={Colors[theme].textBold}>
                  Send Payment
                </Typography>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Typography weight="400" size={12} textType="secondary">
                    Pay 35 espees to the lettubbe espees wallet{" "}
                  </Typography>
                  <TouchableOpacity onPress={handleCopyWallet}>
                    <Typography weight="500" size={12} color="#1890FF" style={{ textDecorationLine: 'underline' }}>
                      {walletAddress}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography weight="600" size={12} color="#fff">2</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography weight="500" size={14} color={Colors[theme].textBold}>
                  Get Proof
                </Typography>
                <Typography weight="400" size={12} textType="secondary">
                  Take a screenshot of your payment confirmation
                </Typography>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Typography weight="600" size={12} color="#fff">3</Typography>
              </View>
              <View style={styles.stepContent}>
                <Typography weight="500" size={14} color={Colors[theme].textBold}>
                  Contact Support
                </Typography>
                <Typography weight="400" size={12} textType="secondary">
                  Send your payment proof to our support team
                </Typography>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentCard}>
          <Typography weight="600" size={16} color="#1890FF">
            Payment Amount: 35 Espees
          </Typography>
          <View style={[styles.paymentNote, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            <Typography weight="400" size={12} color="#1890FF">
              Send to lettubbe espees wallet{" "}
            </Typography>
            <TouchableOpacity onPress={handleCopyWallet}>
              <Typography weight="500" size={12} color="#1890FF" style={{ textDecorationLine: 'underline' }}>
                {walletAddress}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        <AppButton
          title="Contact Support"
          handlePress={handleContactSupport}
          style={styles.supportButton}
          variant="primary"
        />

        <Typography weight="400" size={12} textType="secondary" style={styles.footer}>
          Your account will be upgraded within 24 hours after payment verification
        </Typography>
      </ScrollView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    tintColor: '#AAB8C2'
  },
  subtitle: {
    marginTop: 8,
  },
  benefitsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#52C41A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 19,
    height: 19,
    borderRadius: 12,
    backgroundColor: '#1890FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  paymentCard: {
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  paymentNote: {
    marginTop: 4,
  },
  supportButton: {
    marginBottom: 16,
  },
  footer: {
    marginBottom: 32,
  },
});

export default UpgradeAccount;