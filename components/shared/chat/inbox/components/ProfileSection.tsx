import React, { useState, useCallback } from 'react';
import { View } from 'react-native';

// Hooks
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import { useInboxProfile } from '../hooks/useInboxProfile';

// Components
import { ProfileCard } from './ProfileCard';
import ReportModal from '@/components/shared/home/report/ReportModal';

// Types
import { InboxProfile } from '../types/InboxTypes';

interface ProfileSectionProps {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  subscriberCount: string;
  theme: string;
  onViewProfile: () => void;
  enabled?: boolean; // For lazy loading
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  userId,
  username,
  displayName,
  avatar,
  subscriberCount,
  theme,
  onViewProfile,
  enabled = true,
}) => {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Load profile data (lazy loaded based on enabled prop)
  const { data: preloadedProfileData, profilePic: preloadedProfilePic } = useGetPublicProfile(userId || '', { enabled });

  // Process profile data
  const profile = useInboxProfile({
    preloadedProfileData,
    preloadedProfilePic,
    username,
    displayName,
    avatar,
    subscriberCount
  });

  // Handle report action
  const handleReport = useCallback(() => {
    setIsReportModalVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setIsReportModalVisible(false);
  }, []);

  // Don't render anything if not enabled (lazy loading)
  if (!enabled) {
    return null;
  }

  return (
    <View>
      <ProfileCard
        profile={profile}
        theme={theme}
        onViewProfile={onViewProfile}
        onReport={handleReport}
      />

      <ReportModal
        isVisible={isReportModalVisible}
        onClose={handleCloseReportModal}
        userId={userId}
      />
    </View>
  );
};

export default ProfileSection;