import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getData } from '@/helpers/utils/storage';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import AccountDeletionGracePeriod from './AccountDeletionGracePeriod';
import { useRouter } from 'expo-router';

const AccountDeletionGracePeriodWrapper = () => {
  const [markedForDeletionDate, setMarkedForDeletionDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useCustomTheme();
  const router = useRouter();

  useEffect(() => {
    const fetchDeletionDate = async () => {
      try {
        const userData = await getData("userInfo");
        if (userData && (userData as any)?.markedForDeletionDate) {
          setMarkedForDeletionDate((userData as any).markedForDeletionDate);
        } else {
          // No deletion date found, redirect to main app
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error fetching deletion date:", error);
        // On error, redirect to main app
        router.replace("/(tabs)");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeletionDate();
  }, []);

  const handleReactivate = () => {
    // Refresh user data after reactivation
    router.replace("/(tabs)");
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors[theme].background 
      }}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
      </View>
    );
  }

  if (!markedForDeletionDate) {
    return null; // This shouldn't happen as we redirect above
  }

  return (
    <AccountDeletionGracePeriod 
      markedForDeletionDate={markedForDeletionDate}
      onReactivate={handleReactivate}
    />
  );
};

export default AccountDeletionGracePeriodWrapper;