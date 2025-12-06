import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchPosts } from '@/services/explore.service';
import { ExploreSection, Post } from '@/helpers/types/explore/explore';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'trending' | 'suggestion' | 'channel' | 'video';
}

interface SearchState {
  // Search state
  searchTerm: string;
  isSearchMode: boolean;
  isSearching: boolean;
  searchResults: Post[];
  hasMoreSearchResults: boolean;
  searchPage: number;
  totalSearchPages: number;
  
  // Search history
  searchHistory: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  
  // UserProfileBottomSheet state
  openProfileSheetUserId: string | null;
  
  // Actions
  setSearchTerm: (term: string) => void;
  enterSearchMode: () => void;
  exitSearchMode: () => void;
  clearSearchResults: () => void;
  
  // Search API methods
  performSearch: (term?: string, category?: string, section?: ExploreSection) => Promise<void>;
  loadMoreSearchResults: () => Promise<void>;
  
  // History management
  addToHistory: (term: string) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  
  // Trending searches (would typically come from API)
  setTrendingSearches: (trending: SearchSuggestion[]) => void;
  
  // UserProfileBottomSheet actions
  openProfileSheet: (userId: string) => void;
  closeProfileSheet: () => void;
  
  // Reset store
  reset: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchTerm: '',
      isSearchMode: false,
      isSearching: false,
      searchResults: [],
      hasMoreSearchResults: false,
      searchPage: 1,
      totalSearchPages: 1,
      
      searchHistory: [],
      trendingSearches: [
        // { id: 't1', text: 'expo router', type: 'trending' },
        // { id: 't2', text: 'react native animations', type: 'trending' },
        // { id: 't3', text: 'tailwind css', type: 'trending' },
      ],
      
      // UserProfileBottomSheet state
      openProfileSheetUserId: null,
      
      // Basic state setters
      setSearchTerm: (term) => set({ searchTerm: term }),
      
      enterSearchMode: () => set({ isSearchMode: true }),
      
      exitSearchMode: () => set({ 
        isSearchMode: false, 
        searchTerm: '',
        searchResults: []
      }),
      
      clearSearchResults: () => set({ 
        searchResults: [],
        searchPage: 1,
        totalSearchPages: 1,
        hasMoreSearchResults: false
      }),
      
      // Search API integration
      performSearch: async (term, category, section) => {
        const currentState = get();
        const searchTermToUse = term || currentState.searchTerm;
        
        if (!searchTermToUse) return;
        
        set({ 
          isSearching: true,
          searchPage: 1,
          searchTerm: searchTermToUse,
          isSearchMode: true
        });
        
        try {
          const response = await searchPosts({
            searchTerm: searchTermToUse,
            category,
            page: 1,
            limit: 10,
            section
          });
          
          if (response.success && response.data) {
            set({
              searchResults: response.data.posts || [],
              hasMoreSearchResults: response.data.hasMore || false,
              totalSearchPages: response.data.totalPages || 1,
            });
            
            // Add search term to history if successful
            get().addToHistory(searchTermToUse);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          set({ isSearching: false });
        }
      },
      
      loadMoreSearchResults: async () => {
        const { 
          searchTerm, 
          searchPage, 
          totalSearchPages, 
          isSearching, 
          searchResults 
        } = get();
        
        if (isSearching || searchPage >= totalSearchPages) return;
        
        const nextPage = searchPage + 1;
        
        set({ isSearching: true });
        
        try {
          const response = await searchPosts({
            searchTerm,
            page: nextPage,
            limit: 10
          });
          
          if (response.success && response.data && response.data.posts) {
            set({
              searchResults: [...searchResults, ...response.data.posts],
              searchPage: nextPage,
              hasMoreSearchResults: response.data.hasMore || false
            });
          }
        } catch (error) {
          console.error('Load more search results error:', error);
        } finally {
          set({ isSearching: false });
        }
      },
      
      // History management
      addToHistory: (term) => {
        if (!term.trim()) return;
        
        const { searchHistory } = get();
        
        // Remove duplicate if exists
        const filteredHistory = searchHistory.filter(
          item => item.text.toLowerCase() !== term.toLowerCase()
        );
        
        // Add to beginning of history
        const newHistory = [
          { 
            id: `h-${Date.now()}`, 
            text: term, 
            type: 'history' as const 
          },
          ...filteredHistory
        ].slice(0, 10); // Keep only 10 most recent
        
        set({ searchHistory: newHistory });
      },
      
      clearHistory: () => set({ searchHistory: [] }),
      
      removeFromHistory: (id) => {
        const { searchHistory } = get();
        set({ 
          searchHistory: searchHistory.filter(item => item.id !== id) 
        });
      },
      
      setTrendingSearches: (trending) => set({ trendingSearches: trending }),
      
      // UserProfileBottomSheet actions
      openProfileSheet: (userId) => set({ openProfileSheetUserId: userId }),
      closeProfileSheet: () => set({ openProfileSheetUserId: null }),
      
      // Reset store to initial state
      reset: () => set({
        searchTerm: '',
        isSearchMode: false,
        isSearching: false,
        searchResults: [],
        hasMoreSearchResults: false,
        searchPage: 1,
        totalSearchPages: 1,
        searchHistory: [],
        trendingSearches: [],
        openProfileSheetUserId: null
      })
    }),
    {
      name: 'search-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        trendingSearches: state.trendingSearches,
      }),
    }
  )
);