import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Typography from '@/components/ui/Typography/Typography';
import SimpleInput from '@/components/ui/inputs/SimpleInput';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import { useEditCommunity } from '@/hooks/community/useEditCommunity';
import { useGetCommunity } from '@/hooks/community/useGetCommunity';
import { useUpdateCommunityPhoto } from '@/hooks/community/useUpdateCommunityPhoto';
import { useUpdateCommunityTopics } from '@/hooks/community/useUpdateCommunityTopics';
import AppMenu from '@/components/ui/AppMenu';
import showToast from '@/helpers/utils/showToast';

const communityTypes = [
  { name: 'Public', value: 'public' },
  { name: 'Private', value: 'private' },
  { name: 'Hidden', value: 'hidden' },
];

interface Category {
  id: string;
  name: string;
}

const CATEGORIES: Category[] = [
  { id: 'gaming', name: 'Gaming' },
  { id: 'music-audio', name: 'Music & Audio' },
  { id: 'technology', name: 'Technology' },
  { id: 'education-learning', name: 'Education & Learning' },
  { id: 'ministry-faith', name: 'Ministry & Faith' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'lifestyle-vlogs', name: 'Lifestyle & Vlogs' },
  { id: 'beauty-fashion', name: 'Beauty & Fashion' },
  { id: 'health-fitness', name: 'Health & Fitness' },
  { id: 'movies', name: 'Movies' },
  { id: 'food-cooking', name: 'Food & Cooking' },
  { id: 'travel-adventure', name: 'Travel & Adventure' },
  { id: 'art-creativity', name: 'Art & Creativity' },
  { id: 'business-finance', name: 'Business & Finance' },
  { id: 'sports', name: 'Sports' },
  { id: 'science-nature', name: 'Science & Nature' },
  { id: 'comedy-memes', name: 'Comedy & Memes' },
  { id: 'news-politics', name: 'News & Politics' },
  { id: 'outreaches', name: 'Outreaches' },
  { id: 'crusades', name: 'Crusades' },
  { id: 'lafd', name: 'LFAD' },
  { id: 'lmm', name: 'LMM' },
  { id: 'lima', name: 'LIMA' },
  { id: 'concerts', name: 'Concerts' },
  { id: 'films', name: 'Films' },
  { id: 'rehearsals', name: 'Rehearsals' },
  { id: 'soul-winning', name: 'Soul winning' },
  { id: 'rendition', name: 'Rendition' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'rap', name: 'Rap' },
  { id: 'dance', name: 'Dance' },
  { id: 'orchestra', name: 'Orchestra' },
];

const EditCommunityScreen = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams();
  const { id } = params;

  const { data: communityResponse, isLoading: isCommunityLoading } = useGetCommunity(id as string);
  const { editCommunity, isLoading: isEditingCommunity } = useEditCommunity();
  const { updatePhoto, isLoading: isUpdatingPhoto } = useUpdateCommunityPhoto();
  const { updateCategories, isLoading: isUpdatingCategories } = useUpdateCommunityTopics();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'hidden'>('public');
  const [displayPicture, setDisplayPicture] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const community = communityResponse?.data;

  // Initialize form with community data
  useEffect(() => {
    if (community) {
      setName(community.name || '');
      setDescription(community.description || '');
      setType(community.type || 'public');
      setOriginalPhotoUrl(community.photoUrl || null);
      setDisplayPicture(community.photoUrl || null);
      setSelectedCategories(community.categories || []);
    }
  }, [community]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      showToast('error', 'Name and description are required');
      return;
    }

    try {
      let photoUrl = originalPhotoUrl;

      // If a new photo was selected, upload it first
      if (displayPicture && displayPicture !== originalPhotoUrl) {
        const photoResponse = await updatePhoto(id as string, displayPicture);
        if (photoResponse?.data?.photoUrl) {
          photoUrl = photoResponse.data.photoUrl;
        }
      }

      // Update community categories if they changed
      if (selectedCategories.length > 0) {
        await updateCategories(id as string, selectedCategories);
      }

      // Update community with basic data
      await editCommunity(id as string, {
        name: name.trim(),
        description: description.trim(),
        type,
        ...(photoUrl && { photoUrl }),
      });

      router.back();
    } catch (error: any) {
      console.error('Error updating community:', error);
      showToast('error', error.message || 'Failed to update community');
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else if (prev.length < 4) { // Limit to 4 categories
        return [...prev, categoryId];
      }
      return prev;
    });
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

  const handleBack = () => {
    router.back();
  };

  const isLoading = isEditingCommunity || isUpdatingPhoto || isUpdatingCategories;
  const isSaveEnabled = name.trim().length > 0 && description.trim().length > 0 && !isLoading;

  if (isCommunityLoading) {
    return (
      <Wrapper>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.general.primary} />
            <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
              Loading community...
            </Typography>
          </View>
        </SafeAreaView>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Typography weight="600" size={18} color={Colors[theme].textBold}>
            Edit Community
          </Typography>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isSaveEnabled}
            style={[
              styles.saveButton,
              { opacity: isSaveEnabled ? 1 : 0.5 }
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
                Save
              </Typography>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Community Photo Section */}
            <View style={styles.section}>
              <Typography weight="600" size={16} color={Colors[theme].textBold}>
                Community Photo
              </Typography>
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subtitle}
              >
                Choose a photo that represents your community
              </Typography>

              <View style={styles.photoContainer}>
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
            </View>

            {/* Name Section */}
            <View style={styles.section}>
              <Typography weight="600" size={16} color={Colors[theme].textBold}>
                Community Name
              </Typography>
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subtitle}
              >
                Give your community a catchy name
              </Typography>
              <SimpleInput
                value={name}
                onChangeText={setName}
                placeholder="Enter community name"
                maxLength={50}
              />
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Typography weight="600" size={16} color={Colors[theme].textBold}>
                Description
              </Typography>
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subtitle}
              >
                Describe what your community is about
              </Typography>
              <SimpleInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter community description"
                multiline
                numberOfLines={4}
                maxLength={500}
                style={styles.descriptionInput}
              />
            </View>

            {/* Community Type Section */}
            <View style={styles.section}>
              <Typography weight="600" size={16} color={Colors[theme].textBold}>
                Community Type
              </Typography>
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subtitle}
              >
                Choose who can find and join your community
              </Typography>
              <AppMenu
                width="100%"
                trigger={(isOpen) => (
                  <View style={[styles.typeSelector, { borderColor: Colors[theme].borderColor }]}>
                    <Typography weight="500" color={Colors[theme].textBold}>
                      {communityTypes.find(t => t.value === type)?.name || 'Select Type'}
                    </Typography>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={Colors[theme].icon}
                    />
                  </View>
                )}
                options={communityTypes}
                selectedOption={communityTypes.find(t => t.value === type)?.name || 'Public'}
                onSelect={(option) => {
                  const selectedType = communityTypes.find(t => t.name === option);
                  if (selectedType) {
                    setType(selectedType.value as 'public' | 'private' | 'hidden');
                  }
                }}
              />

              {/* Type descriptions */}
              <View style={styles.typeDescriptions}>
                <Typography size={11} color={Colors[theme].textLight}>
                  • Public: Anyone can find and join
                </Typography>
                <Typography size={11} color={Colors[theme].textLight}>
                  • Private: Invitation required to join
                </Typography>
                <Typography size={11} color={Colors[theme].textLight}>
                  • Hidden: Only members can see the community
                </Typography>
              </View>
            </View>

            {/* Categories Section */}
            <View style={styles.section}>
              <Typography weight="600" size={16} color={Colors[theme].textBold}>
                Categories
              </Typography>
              <Typography
                size={12}
                color={Colors[theme].textLight}
                style={styles.subtitle}
              >
                Pick up to 4 categories that capture your community's vibe
              </Typography>

              <View style={styles.categoriesContainer}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryToggle(category.id)}
                    disabled={!selectedCategories.includes(category.id) && selectedCategories.length >= 4}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategories.includes(category.id)
                          ? Colors.general.primary
                          : Colors[theme].cardBackground,
                        borderColor: Colors[theme].borderColor,
                        opacity: (!selectedCategories.includes(category.id) && selectedCategories.length >= 4) ? 0.5 : 1
                      }
                    ]}
                  >
                    <Typography
                      weight="500"
                      size={14}
                      color={selectedCategories.includes(category.id) ? Colors[theme].background : Colors[theme].textBold}
                    >
                      {category.name}
                    </Typography>
                  </TouchableOpacity>
                ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 16,
  },
  photoContainer: {
    alignItems: 'center',
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
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeDescriptions: {
    marginTop: 8,
    gap: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
});

export default EditCommunityScreen;