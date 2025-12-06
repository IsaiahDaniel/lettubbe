import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import SimpleInput from '@/components/ui/inputs/SimpleInput';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import { useCreateCommunity } from '@/hooks/community/useCreateCommunity';
import showToast from '@/helpers/utils/showToast';

const CreateCommunityStep1 = () => {
  const { theme } = useCustomTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createCommunity, isLoading, error, communityId } = useCreateCommunity();

  const handleNext = async () => {
    if (name.trim() && description.trim()) {
      try {
        // console.log('Step1 - Creating community with:', { name: name.trim(), description: description.trim() });
        const response = await createCommunity(name, description);
        
        // console.log('Step1 - Community creation response:', response);
        
        if (response.success && response.data?._id) {
          const communityId = response.data._id;
          // console.log('Step1 - Navigating to step2 with communityId:', communityId);
          
          // Navigate to step 2 with community ID and data
          router.push({
            pathname: '/(community)/create-step2',
            params: { 
              communityId: communityId,
              name: name.trim(), 
              description: description.trim() 
            }
          });
          showToast('success', 'Community created! Now add a photo.');
        } else {
          console.error('Step1 - Community creation failed:', response);
          showToast('error', response.message || 'Failed to create community');
        }
      } catch (err: any) {
        console.error('Step1 - Error creating community:', err);
        showToast('error', err.message || 'Failed to create community');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isNextEnabled = name.trim().length > 0 && description.trim().length > 0 && !isLoading;

  return (
    <Wrapper>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />

          <TouchableOpacity
            onPress={handleNext}
            disabled={!isNextEnabled}
            style={[
              styles.nextButton,
              { opacity: isNextEnabled ? 1 : 0.5 }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.general.primary} />
            ) : (
              <Typography
                weight="600"
                size={16}
                color={Colors.general.primary}
              >
                Next
              </Typography>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Title Section */}
              <View style={styles.section}>
                <Typography weight="600" size={16} color={Colors[theme].textBold}>
                  Let's build your community
                </Typography>
                <Typography
                  size={12}
                  color={Colors[theme].textLight}
                  style={styles.subtitle}
                >
                  Start with the basics
                </Typography>
              </View>

              {/* Community Name */}
              <View style={styles.inputSection}>
                <SimpleInput
                  placeholder="what's your community called?"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  style={styles.input}
                />
                <Typography size={12} color={Colors[theme].textLight} style={styles.characterCount}>
                  {name.length}/50 characters
                </Typography>
                <Typography size={12} color={Colors[theme].textLight}>
                  Make it catchy, clear, and true to your vibe. This is what everyone will see first.
                </Typography>
              </View>

              {/* Community Description */}
              <View style={styles.inputSection}>
                <SimpleInput
                  placeholder="what's it all about..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                  style={[styles.input, styles.textArea]}
                />
                <Typography size={12} color={Colors[theme].textLight} style={styles.characterCount}>
                  {description.length}/300 characters
                </Typography>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  nextButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  form: {
  },
  section: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    marginTop: 8,
    marginBottom: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  guidelinesContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  guidelineText: {
    marginLeft: 8,
    flex: 1,
  },
  characterCount: {
    textAlign: 'right',
  },
});

export default CreateCommunityStep1;