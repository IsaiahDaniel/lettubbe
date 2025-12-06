import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import SearchField from '@/components/ui/inputs/SearchField';
import Avatar from '@/components/ui/Avatar';
import { Images } from '@/constants';
import { useExploreSearch } from '@/hooks/explore/useExploreSearch';
import { useGetUserIdState } from '@/store/UsersStore';
import EmptyState from '@/components/shared/chat/EmptyState';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  description?: string;
}

const NewMessageScreen = () => {
  const { theme } = useCustomTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const { setUserId } = useGetUserIdState();
  
  const {
    userResults,
    isSearching,
    handleSearch,
    searchTerm,
  } = useExploreSearch();

  const handleUserPress = useCallback((user: User) => {
    // Set the selected user ID for chat
    setUserId(user._id);
    
    // Navigate to the chat screen with the user's information
    router.push({
      pathname: '/(chat)/[Id]/Inbox',
      params: {
        Id: `new-${user._id}`, // Use a temporary ID for new conversations
        username: user.username,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`,
        userId: user._id,
        avatar: user.profilePicture,
        subscriberCount: 0,
      },
    });
  }, [setUserId]);

  const handleBack = () => {
    router.back();
  };

  const onSearch = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  const renderUserItem = ({ item }: { item: User }) => (
    <>
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
      >
        <Avatar
          imageSource={item.profilePicture ? { uri: item.profilePicture } : Images.avatar}
          size={50}
          uri={!!item.profilePicture}
          showRing={true}
          gapSize={1.7}
        />
        
        <View style={styles.userInfo}>
          <Typography weight="500" size={16} color={Colors[theme].textBold}>
            {item.displayName || `${item.firstName} ${item.lastName}`}
          </Typography>
          <Typography size={14} color={Colors[theme].textLight}>
            @{item.username}
          </Typography>
          {item.description && (
            <Typography
              size={12}
              color={Colors[theme].text}
              numberOfLines={1}
              style={styles.description}
            >
              {item.description}
            </Typography>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors[theme].textLight}
        />
      </TouchableOpacity>
      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: Colors[theme].borderColor }]} />
    </>
  );

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Typography textType="textBold" style={styles.loadingText}>
            Searching for users...
          </Typography>
        </View>
      );
    }

    if (searchTerm && !userResults.length) {
      return (
        <EmptyState
          title="No Users Found"
          subtitle={`No users found for "${searchTerm}". Try a different search term.`}
          image={require('@/assets/images/Empty.png')}
        />
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons
            name="search-outline"
            size={64}
            color={Colors[theme].textLight}
          />
          <Typography
            weight="600"
            size={18}
            color={Colors[theme].textBold}
            style={styles.emptyTitle}
          >
            Find People to Message
          </Typography>
          <Typography
            size={14}
            color={Colors[theme].textLight}
            style={styles.emptySubtitle}
          >
            Search for users by name or username to start a new conversation
          </Typography>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[theme].background, borderBottomColor: Colors[theme].borderColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors[theme].textBold} />
        </TouchableOpacity>
        <Typography weight="600" size={18} color={Colors[theme].textBold} style={styles.headerTitle}>
          New Message
        </Typography>
        <View style={styles.headerRight} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchField
          placeholder="Search for people..."
          onSearch={onSearch}
          initialValue={searchQuery}
        />
      </View>

      {/* User List */}
      <FlatList
        data={userResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        style={styles.userList}
        contentContainerStyle={userResults.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
  },
  headerRight: {
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  description: {
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
  },
});

export default NewMessageScreen;