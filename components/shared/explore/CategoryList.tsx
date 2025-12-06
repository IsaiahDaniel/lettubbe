import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { Category } from '@/helpers/types/explore/explore';

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

// mock categories
const categories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'music', name: 'Music' },
  { id: 'travel', name: 'Travel' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'food', name: 'Food' },
  { id: 'tech', name: 'Technology' },
  { id: 'sports', name: 'Sports' },
  { id: 'education', name: 'Education' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'art', name: 'Art' },
  { id: 'news', name: 'News' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'fitness', name: 'Fitness' },
];

const CategoryList: React.FC<CategoryListProps> = ({ 
  selectedCategory,
  onSelectCategory
}) => {
  const { theme } = useCustomTheme();

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          {
            backgroundColor: isSelected 
              ? Colors.general.blue 
              : Colors[theme].cardBackground
          }
        ]}
        onPress={() => onSelectCategory(item.name)}
      >
        <Typography 
          color={isSelected ? Colors[theme].text : Colors.general.primary}
          weight={isSelected ? '600' : '400'}
          size={14}
        >
          {item.name}
        </Typography>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={categories}
      renderItem={renderCategoryItem}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryList;