import React from 'react';
import { View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';
import Avatar from '@/components/ui/Avatar';
import { MentionSuggestionsProps, SearchUser } from '@/helpers/types/mentions.types';
import { MENTION_SEARCH_CONFIG, MENTION_ERROR_MESSAGES, MENTION_UI_CONFIG } from '@/constants/mentions';

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  users,
  isLoading,
  error,
  query,
  onUserSelect,
}) => {
  const { theme } = useCustomTheme();

  /**
   * Render individual user suggestion item
   */
  const renderUserSuggestion = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onUserSelect(item)}
      activeOpacity={0.7}
      delayPressIn={0}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.username} ${item.firstName ? item.firstName + ' ' + (item.lastName || '') : ''}`}
      accessibilityHint="Double tap to mention this user"
    >
      <Avatar
        imageSource={item.profilePicture}
        size={40}
        uri
        expandable={false}
      />
      <View style={styles.suggestionInfo}>
        <Typography weight="600" size={14} color={Colors[theme].textBold}>
          @{item.username}
        </Typography>
        {(item.firstName || item.lastName) && (
          <Typography weight="400" size={12} color={Colors[theme].textLight}>
            {item.firstName} {item.lastName}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <View style={[styles.loadingContainer, { backgroundColor: Colors[theme].background }]}>
      <Typography size={14} color={Colors[theme].textLight}>
        Searching users...
      </Typography>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Typography size={14} color={Colors.general.error || '#ff4444'}>
        {MENTION_ERROR_MESSAGES.SEARCH_FAILED}
      </Typography>
    </View>
  );

  /**
   * Render threshold message
   */
  const renderThresholdMessage = () => (
    <View style={styles.thresholdContainer}>
      <Typography size={14} color={Colors[theme].textLight}>
        {MENTION_ERROR_MESSAGES.THRESHOLD_MESSAGE}
      </Typography>
    </View>
  );

  /**
   * Render no results state
   */
  const renderNoResults = () => (
    <View style={styles.noResultsContainer}>
      <Typography size={14} color={Colors[theme].textLight}>
        {MENTION_ERROR_MESSAGES.NO_RESULTS} for "@{query}"
      </Typography>
    </View>
  );

  /**
   * Render user suggestions list
   */
  const renderUsersList = () => (
    <FlatList
      data={users.slice(0, MENTION_SEARCH_CONFIG.MAX_SUGGESTIONS)}
      renderItem={renderUserSuggestion}
      keyExtractor={(item) => item._id}
      style={styles.suggestionsList}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );

  /**
   * Determine what content to render based on state
   */
  const renderContent = () => {
    if (query.length < MENTION_SEARCH_CONFIG.MIN_CHARACTERS) {
      return renderThresholdMessage();
    }
    
    if (error) {
      return renderErrorState();
    }
    
    if (isLoading) {
      return renderLoadingState();
    }
    
    if (users.length > 0) {
      return renderUsersList();
    }
    
    return renderNoResults();
  };

  return (
    <View 
      style={[
        styles.suggestionsContainer,
        { backgroundColor: Colors[theme].background }
      ]}
      accessibilityRole="menu"
      accessibilityLabel="User suggestions for mentions"
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    maxHeight: MENTION_UI_CONFIG.SUGGESTION_HEIGHT,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: MENTION_UI_CONFIG.SUGGESTION_HEIGHT,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  thresholdContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default MentionSuggestions;