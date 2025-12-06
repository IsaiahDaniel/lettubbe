import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import { useUpdateCommunityPhoto } from '@/hooks/community/useUpdateCommunityPhoto';
import showToast from '@/helpers/utils/showToast';

const CreateCommunityStep2 = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams();
  const { name, description, communityId } = params;
  const [displayPicture, setDisplayPicture] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const { updatePhoto, isLoading } = useUpdateCommunityPhoto();

  // Debug logging
  // console.log('Step2 - Received params:', { name, description, communityId, allParams: params });

  // Validation and error handling
  if (!communityId) {
    console.error('Step2 - No communityId found in params, redirecting to step1');
    showToast('error', 'Community ID missing. Please start over.');
    router.replace('/(community)/create-step1');
    return;
  }

  const handleNext = async () => {
    // console.log('Step2 - handleNext called with:', { displayPicture: !!displayPicture, communityId });
    
    // If photo is selected, upload it first
    if (displayPicture && communityId) {
      try {
        // console.log('Step2 - About to call updatePhoto with communityId:', communityId);
        const response = await updatePhoto(communityId as string, displayPicture);
        
        if (response.success) {
          router.push({
            pathname: '/(community)/create-step3',
            params: {
              communityId,
              name,
              description,
              displayPicture: displayPicture || ''
            }
          });
          showToast('success', 'Photo uploaded successfully!');
        } else {
          showToast('error', response.message || 'Failed to upload photo');
        }
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        showToast('error', err.message || 'Failed to upload photo');
      }
    } else {
      // Skip photo step and go to next
      router.push({
        pathname: '/(community)/create-step3',
        params: {
          communityId,
          name,
          description,
          displayPicture: ''
        }
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const pickImage = async () => {
    if (isPickingImage) return; // Prevent multiple simultaneous launches
    
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setDisplayPicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const removeImage = () => {
    setDisplayPicture(null);
  };

  return (
    <Wrapper>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />

          <TouchableOpacity 
            onPress={handleNext} 
            disabled={isLoading}
            style={[styles.nextButton, { opacity: isLoading ? 0.5 : 1 }]}
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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Title Section */}
          <View style={styles.section}>
            <Typography weight="600" size={16} color={Colors[theme].textBold}>
              Add a community photo
            </Typography>
            <Typography
              size={12}
              color={Colors[theme].textLight}
              style={styles.subtitle}
            >
              Every community needs a face. You can always do this later.
            </Typography>
          </View>

          {/* Community Preview Card*/}
          <View style={styles.profileCardContainer}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                onPress={pickImage}
                disabled={isPickingImage}
                style={[
                  styles.pictureContainer,    
                  { 
                    borderColor: Colors[theme].borderColor, 
                    backgroundColor: Colors[theme].sheetBackground,
                    opacity: isPickingImage ? 0.5 : 1 
                  }
                ]}
              >
                {displayPicture ? (
                  <>
                    <Image source={{ uri: displayPicture }} style={styles.displayPicture} />
                    <TouchableOpacity
                      onPress={removeImage}
                      style={styles.removePictureButton}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.general.error} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.placeholderPicture}>
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={Colors[theme].textLight}
                    />
                    <Typography
                      size={12}
                      color={Colors[theme].textLight}
                      style={styles.addPictureText}
                    >
                      Add Picture
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={[styles.profileCard, { backgroundColor: Colors[theme].cardBackground }]}>
              {/* Community Info */}
              <View style={styles.communityInfo}>
                <Typography weight="600" size={20} color={Colors[theme].textBold} style={styles.communityName}>
                  {name}
                </Typography>
                {/* Member Count Preview */}
                <View style={styles.memberPreview}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={Colors[theme].textLight}
                  />
                  <Typography size={12} color={Colors[theme].textLight} style={styles.memberText}>
                    You will be the first member
                  </Typography>
                </View>
                <Typography
                  size={14}
                  color={Colors[theme].textLight}
                  style={styles.previewDescription}
                >
                  {description}
                </Typography>


              </View>
            </View>
          </View>
        </ScrollView>
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
  nextButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  profileCardContainer: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    zIndex: 2,
  },
  pictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  displayPicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  removePictureButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  placeholderPicture: {
    alignItems: 'center',
  },
  addPictureText: {
    marginTop: 4,
  },
  profileCard: {
    borderRadius: 20,
    paddingTop: 60, 
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -50,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  communityInfo: {
    alignItems: 'center',
  },
  communityName: {
    textAlign: 'center',
  },
  previewDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  memberPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberText: {
    marginLeft: 4,
  },
});

export default CreateCommunityStep2;