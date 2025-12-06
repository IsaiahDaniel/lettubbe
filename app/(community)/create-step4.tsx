import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import AppButton from '@/components/ui/AppButton';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import { useFinalizeCommunity } from '@/hooks/community/useFinalizeCommunity';
import showToast from '@/helpers/utils/showToast';

type VisibilityOption = 'public' | 'private' | 'hidden';

interface VisibilityConfig {
  id: VisibilityOption;
  title: string;
  description: string;
  icon: string;
  bottomText: string;
}

const VISIBILITY_OPTIONS: VisibilityConfig[] = [
  {
    id: 'public',
    title: 'Public',
    description: 'Come one, come all.',
    icon: 'globe-outline',
    bottomText: 'Anyone can find, view, and join your community. Perfect for open convos, welcoming newcomers, or spreading light far and wide.'
  },
  {
    id: 'private',
    title: 'Private',
    description: 'Your inner circle.',
    icon: 'lock-closed-outline',
    bottomText: 'Only approved members can join and see content. Great for close friends, family groups, or focused discussions.'
  },
  {
    id: 'hidden',
    title: 'Hidden',
    description: 'Secret sanctuary.',
    icon: 'eye-off-outline',
    bottomText: 'Completely private and invitation-only. Perfect for sensitive topics, exclusive groups, or maximum privacy.'
  }
];

const CreateCommunityStep4 = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams();
  const { name, description, displayPicture, communityId, categories } = params;

  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityOption>('public');
  const { finalize, isLoading } = useFinalizeCommunity();

  const handleBack = () => {
    router.back();
  };

  const handleCreateCommunity = async () => {
    if (!communityId) {
      showToast('error', 'Community ID is missing');
      return;
    }

    try {
      const response = await finalize(communityId as string, selectedVisibility);
      
      if (response.success) {
        showToast('success', 'Community created successfully!');
        
        // Navigate to the community chat screen with the actual community ID
        // Use replace to clear the creation flow from navigation stack
        router.replace({
          pathname: '/(community)/[id]',
          params: {
            id: response.data._id,
            name: response.data.name,
            isNew: 'true'
          }
        });
      } else {
        showToast('error', response.message || 'Failed to create community');
      }
    } catch (err: any) {
      console.error('Error finalizing community:', err);
      showToast('error', err.message || 'Failed to create community');
    }
  };

  const selectedOption = VISIBILITY_OPTIONS.find(opt => opt.id === selectedVisibility);

  return (
    <Wrapper>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />

          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Title Section */}
          <View style={styles.section}>
            <Typography weight="600" size={16} color={Colors[theme].textBold}>
              Set the vibe for your space
            </Typography>
            <Typography
              size={14}
              color={Colors[theme].textLight}
              style={styles.subtitle}
            >
              Is this a wide-open party or a cozy circle? You decide.
            </Typography>
          </View>

          {/* Visibility Options */}
          <View style={styles.optionsContainer}>
            {VISIBILITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedVisibility(option.id)}
                style={
                  styles.optionCard
                }
              >
                <View style={styles.optionContent}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={Colors[theme].textBold}
                    style={styles.optionIcon}
                  />
                  <View style={styles.optionTexts}>
                    <Typography
                      weight="600"
                      size={14}
                      color={Colors[theme].textBold}
                    >
                      {option.title}
                    </Typography>
                    <Typography
                      size={12}
                      color={Colors[theme].textLight}
                      style={styles.optionDescription}
                    >
                      {option.description}
                    </Typography>
                  </View>

                  <View style={[
                    styles.radioButton,
                    {
                      borderColor: selectedVisibility === option.id
                        ? Colors.general.primary
                        : Colors[theme].borderColor
                    }
                  ]}>
                    {selectedVisibility === option.id && (
                      <View style={[styles.radioButtonInner, { backgroundColor: Colors.general.primary }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Bottom Text */}
          <View style={styles.bottomTextContainer}>
            <Typography
              size={14}
              color={Colors[theme].textLight}
              style={styles.bottomText}
            >
              {selectedOption?.bottomText}
            </Typography>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <AppButton
            title={isLoading ? "Creating..." : "Done"}
            handlePress={handleCreateCommunity}
            disabled={isLoading}
            style={{
              ...styles.createButton,
              opacity: isLoading ? 0.7 : 1
            }}
            isLoading={isLoading}
          />
        </View>
      </SafeAreaView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionTexts: {
    flex: 1,
  },
  optionDescription: {
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 100,
  },
  bottomTextContainer: {
    marginBottom: 32,
  },
  bottomText: {
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  createButton: {
    width: '100%',
  },
});

export default CreateCommunityStep4;