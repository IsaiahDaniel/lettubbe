import React from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import RemixIcon from 'react-native-remix-icon';
import { TAG_CATEGORIES } from '@/constants/tagCategories';
import { TagSearchState } from '@/helpers/types/edit-video.types';

interface TagInputProps {
  selectedTags: string[];
  searchState: TagSearchState;
  expandedCategories: Set<string>;
  onSearchChange: (text: string) => void;
  onAddTag: (tag?: string) => void;
  onRemoveTag: (index: number) => void;
  onToggleCategory: (category: string) => void;
}

export const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  searchState,
  expandedCategories,
  onSearchChange,
  onAddTag,
  onRemoveTag,
  onToggleCategory,
}) => {
  const { theme } = useCustomTheme();

  const inputStyle = {
    backgroundColor: Colors[theme].inputBackground,
    color: Colors[theme].text,
    borderColor: Colors[theme].cardBackground,
  };

  return (
    <View style={styles.container}>
      <Typography weight="600" size={14} textType="textBold" style={styles.label}>
        Tags
      </Typography>
      
      <SelectedTags 
        tags={selectedTags}
        onRemoveTag={onRemoveTag}
      />

      <SearchInput 
        value={searchState.searchQuery}
        onChangeText={onSearchChange}
        onSubmit={() => onAddTag()}
        inputStyle={inputStyle}
        theme={theme}
      />

      {searchState.showResults ? (
        <SearchResults 
          filteredTags={searchState.filteredTags}
          selectedTags={selectedTags}
          onAddTag={onAddTag}
          theme={theme}
        />
      ) : (
        <CategorySections 
          expandedCategories={expandedCategories}
          selectedTags={selectedTags}
          onToggleCategory={onToggleCategory}
          onAddTag={onAddTag}
          theme={theme}
        />
      )}
    </View>
  );
};

const SelectedTags: React.FC<{ tags: string[]; onRemoveTag: (index: number) => void }> = ({
  tags,
  onRemoveTag,
}) => (
  <View style={styles.tagsContainer}>
    {tags.map((tag, index) => (
      <View key={index} style={[styles.tag, { backgroundColor: Colors.general.primary }]}>
        <Typography size={12} color="#FFF">{tag}</Typography>
        <TouchableOpacity onPress={() => onRemoveTag(index)} style={styles.removeTag}>
          <RemixIcon name="close-line" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

const SearchInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  inputStyle: any;
  theme: string;
}> = ({ value, onChangeText, onSubmit, inputStyle, theme }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={[styles.searchInput, inputStyle]}
      value={value}
      onChangeText={onChangeText}
      placeholder="Search for tags..."
      placeholderTextColor={Colors[theme].textLight}
      onSubmitEditing={onSubmit}
    />
  </View>
);

const SearchResults: React.FC<{
  filteredTags: string[];
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  theme: string;
}> = ({ filteredTags, selectedTags, onAddTag, theme }) => (
  <View style={styles.searchResults}>
    <ScrollView style={styles.searchScroll} nestedScrollEnabled={true}>
      {filteredTags.length > 0 ? (
        <View style={styles.filteredTags}>
          {filteredTags.slice(0, 20).map((tag, index) => (
            <TagButton 
              key={`filtered-${tag}-${index}`}
              tag={tag}
              isSelected={selectedTags.includes(tag)}
              onPress={() => onAddTag(tag)}
              theme={theme}
            />
          ))}
        </View>
      ) : (
        <Typography size={12} textType="secondary" style={styles.noResults}>
          No tags found. Try a different search.
        </Typography>
      )}
    </ScrollView>
  </View>
);

const CategorySections: React.FC<{
  expandedCategories: Set<string>;
  selectedTags: string[];
  onToggleCategory: (category: string) => void;
  onAddTag: (tag: string) => void;
  theme: string;
}> = ({ expandedCategories, selectedTags, onToggleCategory, onAddTag, theme }) => (
  <ScrollView style={styles.categories} nestedScrollEnabled={true}>
    {Object.entries(TAG_CATEGORIES).slice(0, 3).map(([category, categoryTags]) => (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          onPress={() => onToggleCategory(category)}
          style={styles.categoryHeader}
        >
          <Typography size={14} weight="600" style={styles.categoryTitle}>
            {category}
          </Typography>
          <RemixIcon
            name={expandedCategories.has(category) ? 'arrow-up-s-line' : 'arrow-down-s-line'}
            size={16}
            color={Colors[theme].text}
          />
        </TouchableOpacity>

        {expandedCategories.has(category) && (
          <View style={styles.categoryTags}>
            {categoryTags.slice(0, 12).map((tag, index) => (
              <TagButton
                key={`${category}-${tag}-${index}`}
                tag={tag}
                isSelected={selectedTags.includes(tag)}
                onPress={() => onAddTag(tag)}
                theme={theme}
              />
            ))}
          </View>
        )}
      </View>
    ))}
    <Typography size={11} textType="secondary" style={styles.searchHint}>
      Type to search through all available tags
    </Typography>
  </ScrollView>
);

const TagButton: React.FC<{
  tag: string;
  isSelected: boolean;
  onPress: () => void;
  theme: string;
}> = ({ tag, isSelected, onPress, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tagButton,
      {
        backgroundColor: isSelected
          ? Colors.general.primary
          : Colors[theme].cardBackground,
      },
    ]}
  >
    <Typography
      size={12}
      color={isSelected ? '#FFF' : Colors[theme].text}
    >
      {tag}
    </Typography>
    {isSelected && (
      <RemixIcon name="check-line" size={14} color="#FFF" />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  removeTag: {
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    paddingLeft: 14,
    fontSize: 14,
    marginRight: 8,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchScroll: {
    maxHeight: 200,
  },
  filteredTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  categories: {
    maxHeight: 250,
    marginTop: 8,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  categoryTitle: {
    flex: 1,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noResults: {
    padding: 12,
    textAlign: 'center',
  },
  searchHint: {
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});