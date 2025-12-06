import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/explore/useDebounce';
import { getAllTags, searchTags } from '@/constants/tagCategories';
import { addUniqueTag, removeTagAtIndex } from '@/helpers/utils/tag-utils';
import { TagSearchState } from '@/helpers/types/edit-video.types';

export const useTagSearch = (
  selectedTags: string[],
  onTagsChange: (tags: string[]) => void
) => {
  const [searchState, setSearchState] = useState<TagSearchState>({
    searchQuery: '',
    showResults: false,
    filteredTags: [],
  });

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Debounce search to improve performance
  const debouncedSearchQuery = useDebounce(searchState.searchQuery, 300);

  const handleSearchChange = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      searchQuery: query,
      showResults: query.trim() !== '',
      filteredTags: query.trim() ? searchTags(query) : [],
    }));
  }, []);

  const addTag = useCallback((tag?: string) => {
    const tagToAdd = tag || searchState.searchQuery.trim();
    if (tagToAdd) {
      const updatedTags = addUniqueTag(selectedTags, tagToAdd);
      onTagsChange(updatedTags);
      
      // Clear search state
      setSearchState({
        searchQuery: '',
        showResults: false,
        filteredTags: [],
      });
    }
  }, [searchState.searchQuery, selectedTags, onTagsChange]);

  const removeTag = useCallback((index: number) => {
    const updatedTags = removeTagAtIndex(selectedTags, index);
    onTagsChange(updatedTags);
  }, [selectedTags, onTagsChange]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      searchQuery: '',
      showResults: false,
      filteredTags: [],
    });
  }, []);

  return {
    searchState,
    expandedCategories,
    handleSearchChange,
    addTag,
    removeTag,
    toggleCategory,
    clearSearch,
    allTags: getAllTags(),
  };
};