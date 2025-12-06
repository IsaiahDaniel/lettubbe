import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useDebounce } from "@/hooks/explore/useDebounce";
import { useSearchStore } from "@/store/searchStore";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "history" | "trending" | "suggestion" | "channel" | "video";
}

interface EnhancedSearchFieldProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  otherStyles?: any;
  initialValue?: string;
  onBackPress?: () => void;
  autoFocus?: boolean;
}

const EnhancedSearchField: React.FC<EnhancedSearchFieldProps> = ({
  placeholder = "Search...",
  onSearch,
  onFocusChange,
  otherStyles,
  initialValue = "",
  onBackPress,
  autoFocus = false,
}) => {
  const { theme } = useCustomTheme();
  const borderColor = theme === "dark" ? "#1B2537" : "#E2E8F0";
  const inputRef = useRef<TextInput>(null);
  
  // Local state
  const [value, setValue] = useState<string>(initialValue);
  const [isFocus, setIsFocus] = useState<boolean>(autoFocus);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchSubmitted, setIsSearchSubmitted] = useState<boolean>(false);

  // Update internal value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  // Get search store values
  const { 
    searchHistory, 
    trendingSearches,
    addToHistory,
    setSearchTerm,
    enterSearchMode,
    performSearch
  } = useSearchStore();
  
  const debouncedSearchTerm = useDebounce(value, 300);

  useEffect(() => {
    // Skip processing if search was just submitted
    if (isSearchSubmitted) {
      return;
    }

    if (debouncedSearchTerm && isFocus) {
      fetchSuggestions(debouncedSearchTerm);
    } else if (isFocus) {
      // Show history when empty but focused
      setSuggestions([
        ...searchHistory,
        ...trendingSearches,
      ]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [debouncedSearchTerm, isFocus, searchHistory, trendingSearches, isSearchSubmitted]);

  // keyboard event listeners to handle dismissal
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (isSearchSubmitted) {
          setIsFocus(false);
          setShowSuggestions(false);
        }
      }
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [isSearchSubmitted]);

  // Reset the search submitted flag when focus changes
  useEffect(() => {
    if (!isFocus) {
      setIsSearchSubmitted(false);
    }
  }, [isFocus]);

  const fetchSuggestions = (query: string) => {
    // Filter history based on input
    const filteredHistory = searchHistory.filter(item =>
      item.text.toLowerCase().includes(query.toLowerCase())
    );
    
    // Add dynamic suggestions based on input
    const dynamicSuggestions: SearchSuggestion[] = [
      // { id: `s1-${query}`, text: `${query}`, type: "suggestion" },
      // { id: `s2-${query}`, text: `${query} tutorial`, type: "suggestion" },
      // { id: `s3-${query}`, text: `best ${query} channels`, type: "suggestion" },
      // { id: `c1-${query}`, text: `${query} Official`, type: "channel" },
      // { id: `v1-${query}`, text: `${query} latest video`, type: "video" },
    ];
    
    setSuggestions([...filteredHistory, ...dynamicSuggestions]);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    setIsFocus(true);
    setIsSearchSubmitted(false);
    if (onFocusChange) onFocusChange(true);
    
    // Show history when focused with empty input
    if (!value) {
      setSuggestions([
        ...searchHistory,
        ...trendingSearches,
      ]);
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    if (onFocusChange) onFocusChange(false);
    
    // Use a delayed blur to allow clicking suggestions
    setTimeout(() => {
      // Only blur if not in search submitted state
      if (!isSearchSubmitted) {
        setIsFocus(false);
        setShowSuggestions(false);
      }
    }, 100);
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setIsFocus(false);
    setShowSuggestions(false);
    setIsSearchSubmitted(false);
    if (onBackPress) onBackPress();
  };

  const handleSubmit = () => {
    if (value.trim()) {
      // Set search submitted flag
      setIsSearchSubmitted(true);
      
      // Hide suggestions immediately
      setShowSuggestions(false);
      
      const searchQuery = value.trim();
      
      // Add to search history
      addToHistory(searchQuery);
      
      // Set search term in store
      setSearchTerm(searchQuery);
      enterSearchMode();
      
      // Either call performSearch or the onSearch prop
      performSearch(searchQuery);
      onSearch(searchQuery);
      
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    // Set search submitted flag
    setIsSearchSubmitted(true);
    
    // Hide suggestions immediately
    setShowSuggestions(false);
    
    setValue(suggestion.text);
    
    // Add to search history when selecting a suggestion
    addToHistory(suggestion.text);
    
    // Set search term in store
    setSearchTerm(suggestion.text);
    enterSearchMode();
    
    // Either call performSearch or the onSearch prop
    performSearch(suggestion.text);
    onSearch(suggestion.text);
    
    Keyboard.dismiss();
  };

  // Function to delete from history
  const handleDeleteHistoryItem = (id: string, event: any) => {
    event.stopPropagation();
    const { removeFromHistory } = useSearchStore.getState();
    removeFromHistory(id);
  };

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    // Choose icon based on suggestion type
    let iconName: any = "search";
    if (item.type === "history") iconName = "time";
    if (item.type === "trending") iconName = "trending-up";
    if (item.type === "channel") iconName = "person-circle";
    if (item.type === "video") iconName = "videocam";

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <Ionicons 
          name={iconName} 
          size={18} 
          color={Colors[theme].textLight} 
          style={styles.suggestionIcon}
        />
        <Typography style={styles.suggestionText} size={14} color={Colors[theme].text}>
          {item.text}
        </Typography>
        
        {/* Show delete button for history items */}
        {item.type === "history" && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(event) => handleDeleteHistoryItem(item.id, event)}
          >
            <Ionicons name="close-circle" size={18} color={Colors[theme].textLight} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, otherStyles]}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: Colors[theme].inputBackground,
            borderColor: isFocus ? Colors.general.primary : borderColor,
          },
        ]}
      >
        {isFocus ? (
          <TouchableOpacity onPress={handleBack} style={styles.iconContainer}>
            <Ionicons 
              name="arrow-back" 
              size={22} 
              color={theme === "light" ? "#10192D" : Colors[theme].textLight} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={theme === "light" ? "#10192D" : Colors[theme].textLight} 
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: Colors[theme].text }
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors[theme].textLight}
          value={value}
          onChangeText={setValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
        />

        {value ? (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close" size={20} color={Colors[theme].textLight} />
          </Pressable>
        ) : null}
      </View>

      {showSuggestions && suggestions.length > 0 && !isSearchSubmitted && (
        <View 
          style={[
            styles.suggestionsContainer,
            { backgroundColor: Colors[theme].background }
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    height: 49,
    paddingHorizontal: 5,
  },
  iconContainer: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope-Regular",
    lineHeight: 24,
  },
  clearButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  }
});

export default EnhancedSearchField;