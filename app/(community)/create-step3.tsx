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
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants/Colors';
import Wrapper from '@/components/utilities/Wrapper';
import BackButton from '@/components/utilities/BackButton';
import { useUpdateCommunityTopics } from '@/hooks/community/useUpdateCommunityTopics';
import showToast from '@/helpers/utils/showToast';

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

const CreateCommunityStep3 = () => {
  const { theme } = useCustomTheme();
  const params = useLocalSearchParams();
  const { name, description, displayPicture, communityId } = params;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { updateCategories, isLoading } = useUpdateCommunityTopics();

  const handleNext = async () => {
    if (selectedCategories.length > 0 && communityId) {
      try {
        const response = await updateCategories(communityId as string, selectedCategories);

        if (response.success) {
          router.push({
            pathname: '/(community)/create-step4',
            params: {
              communityId,
              name,
              description,
              displayPicture,
              categories: selectedCategories.join(',')
            }
          });
          showToast('success', 'Categories updated successfully!');
        } else {
          showToast('error', response.message || 'Failed to update categories');
        }
      } catch (err: any) {
        console.error('Error updating categories:', err);
        showToast('error', err.message || 'Failed to update categories');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else if (prev.length < 7) { // Limit to 7 categories
        return [...prev, categoryId];
      }
      return prev;
    });
  };

  const isNextEnabled = selectedCategories.length > 0 && !isLoading;

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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Typography weight="600" size={20} color={Colors[theme].textBold}>
              What's your community all about?
            </Typography>
            <Typography
              size={14}
              color={Colors[theme].textLight}
              style={styles.subtitle}
            >
              Pick up to 7 categories that capture your vibe
            </Typography>
          </View>

          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryToggle(category.id)}
                disabled={!selectedCategories.includes(category.id) && selectedCategories.length >= 7}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategories.includes(category.id)
                      ? Colors.general.primary
                      : Colors[theme].cardBackground,
                    borderColor: Colors[theme].borderColor,
                    opacity: (!selectedCategories.includes(category.id) && selectedCategories.length >= 7) ? 0.5 : 1
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
  titleSection: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
});

export default CreateCommunityStep3;