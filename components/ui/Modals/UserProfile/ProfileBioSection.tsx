import React from "react";
import { View, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import { ExternalLink } from "@/components/ExternalLink";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface ProfileBioSectionProps {
  isLoadingProfile: boolean;
  profileData: any;
  theme: string;
}

const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
  isLoadingProfile,
  profileData,
}) => {
  const { theme } = useCustomTheme();
  return (
    <View style={[styles.bioContainer, { backgroundColor: Colors[theme].cardBackground }]}>
      {isLoadingProfile ? (
        <>
          <View style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 8, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
          <View style={[styles.skeletonText, { width: '70%', height: 16, backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]} />
        </>
      ) : (
        <>
          <Typography style={styles.bioText}>
            {profileData?.description ? profileData?.description : "No bio"}
          </Typography>
          {profileData?.websiteLink && (
            <ExternalLink href={profileData?.websiteLink}>
              <Typography style={styles.externalLink}>
                {profileData?.websiteLink}
              </Typography>
            </ExternalLink>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bioContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 10,
  },
  bioText: {
    marginBottom: 10,
  },
  externalLink: {
    color: "#0390C1",
  },
  skeletonText: {
    borderRadius: 4,
    opacity: 0.6,
  },
});

export default ProfileBioSection;