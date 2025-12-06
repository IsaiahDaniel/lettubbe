import { View, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import Wrapper from "@/components/utilities/Wrapper";
import BackButton from "@/components/utilities/BackButton";
import Typography from "@/components/ui/Typography/Typography";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import useAuth from "@/hooks/auth/useAuth";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import CustomAlert from "@/components/ui/CustomAlert";
import useVerificationBadge from "@/hooks/profile/useVerificationBadge";

const Settings = () => {
  const { theme } = useCustomTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const { alertConfig, isVisible, showConfirm, hideAlert } = useCustomAlert();
  const { data: verificationData } = useVerificationBadge();
  
  // Check if user is verified
  const isUserVerified = verificationData?.data?.isVerified || false;
  
  const handleLogout = () => {
    showConfirm(
      "Confirm Logout",
      "Are you sure you want to log out? You will need to sign in again to access your account.",
      logout,
      undefined,
      "Log Out",
      "Cancel",
      "danger"
    );
  };
  
  const settingsData = [
    // Only show upgrade option if user is not verified
    ...(!isUserVerified ? [{ title: "Upgrade account", onPress: () => router.push("/(settings)/UpgradeAccount"), isUpgrade: true }] : []),
    { title: "General", onPress: () => router.push("/(settings)/General") },
    { title: "Appearance", onPress: () => router.push("/(settings)/Appearance") },
    { title: "Privacy", onPress: () => router.push("/(settings)/Privacy") },
    // { title: "Your activity", onPress: () => {} },
    // { title: "Notifications", onPress: () => {} },
    // { title: "Security", onPress: () => {} },
    // { title: "Help", onPress: () => {} },
    // { title: "Terms of service", onPress: () => {} },
    // { title: "Send feedback", onPress: () => {} },
    // { title: "About", onPress: () => {} },
    { title: "Logout", onPress: handleLogout },
  ];
  
  return (
    <Wrapper>
      <BackButton />
      <View style={{ marginTop: 12, gap: 10 }}>
        {settingsData.map((item, index) => (
          <TouchableOpacity key={index} onPress={item.onPress} style={{ padding: 10, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            {item.isUpgrade && (
              <Image source={Icons.badge} style={{ width: 20, height: 20, marginRight: 8, tintColor: "#AAB8C2" }} />
            )}
            <Typography weight="700" size={16} color={item.title === "Logout" ? "#F5222D" : Colors[theme].textBold}>
              {item.title}
            </Typography>
            {item.isUpgrade && (
              <View style={{
                position: 'absolute',
                top: 8,
                left: 24,
                width: 8,
                height: 8,
                backgroundColor: '#FF4444',
                borderRadius: 4,
              }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Custom Alert for Logout Confirmation */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          primaryButton={alertConfig.primaryButton}
          secondaryButton={alertConfig.secondaryButton}
          onClose={hideAlert}
          variant={alertConfig.variant}
        />
      )}
    </Wrapper>
  );
};

export default Settings;