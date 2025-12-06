import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import CategoryCard from './CategoryCard';
import { Colors } from '@/constants';
import { Category } from '@/helpers/types/streaming/streaming.types';

interface PopularCategoriesSectionProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
  onViewAllPress: () => void;
  onRefresh?: () => void;
}

const PopularCategoriesSection = ({ 
  categories, 
  onCategoryPress, 
  onViewAllPress,
  onRefresh
}: PopularCategoriesSectionProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography size={16} weight="700">
          Categories
        </Typography>
        {/* {categories?.length > 0 && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Typography
              size={14}
              weight="500"
              color={Colors.general.primary}
            >
              View All
            </Typography>
          </TouchableOpacity>
        )} */}
      </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.scrollView}
        >
          {categories.map(category => (
            <CategoryCard 
              key={category._id} 
              category={category} 
              onPress={onCategoryPress} 
            />
          ))}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    marginHorizontal: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollView: {
    marginHorizontal: -16,
  },
  scrollContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  },
});

export default PopularCategoriesSection;