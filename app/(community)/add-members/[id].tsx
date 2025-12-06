import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import Wrapper from '@/components/utilities/Wrapper';
import AppButton from '@/components/ui/AppButton';
import SearchField from '@/components/ui/inputs/SearchField';
import { useExploreSearch } from '@/hooks/explore/useExploreSearch';
import { useAddMembers } from '@/hooks/community/useAddMembers';

interface User {
  _id: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

const AddMembersScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { theme } = useCustomTheme();
  
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  // Use the same search functionality as new-message screen
  const {
    userResults,
    isSearching,
    handleSearch,
    searchTerm,
  } = useExploreSearch();
  
  // Add members mutation with proper query invalidation
  const addMembersMutation = useAddMembers();
  
  // Handle successful member addition
  const handleMembersAdded = useCallback(() => {
    router.back();
  }, [router]);
  
  // Configure the mutation with success callback
  React.useEffect(() => {
    if (addMembersMutation.isSuccess) {
      handleMembersAdded();
    }
  }, [addMembersMutation.isSuccess, handleMembersAdded]);
  
  const users = userResults || [];
  
  const handleBack = () => {
    router.back();
  };
  
  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };
  
  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    
    const userIds = selectedUsers.map(user => user._id);
    console.log('Adding members to community:', { communityId: id, userIds });
    
    addMembersMutation.mutate({
      communityId: id as string,
      userIds
    });
  };
  
  const isUserSelected = (userId: string) => {
    return selectedUsers.some(user => user._id === userId);
  };
  
  const renderUserItem = ({ item }: { item: User }) => {
    const displayName = item.displayName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || 'Unknown User';
    const isSelected = isUserSelected(item._id);
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserSelect(item)}
      >
        <Avatar
          imageSource={{ uri: item.profilePicture || '' }}
          size={48}
          uri
          showRing={false}
        />
        <View style={styles.userInfo}>
          <Typography weight="500" textType="textBold">
            {displayName}
          </Typography>
          <Typography size={12} color={Colors[theme].textLight}>
            @{item.username || 'unknown'}
          </Typography>
        </View>
        <View style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? Colors.general.primary : 'transparent',
            borderColor: isSelected ? Colors.general.primary : Colors[theme].borderColor
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderSelectedUser = ({ item }: { item: User }) => {
    const displayName = item.displayName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || 'Unknown User';
    
    return (
      <View style={styles.selectedUserChip}>
        <Avatar
          imageSource={{ uri: item.profilePicture || '' }}
          size={24}
          uri
          showRing={false}
        />
        <Typography size={12} weight="500" style={{ marginLeft: 6, marginRight: 6 }}>
          {displayName}
        </Typography>
        <TouchableOpacity onPress={() => handleUserSelect(item)}>
          <Ionicons name="close" size={16} color={Colors[theme].textLight} />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Wrapper>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <SafeAreaView style={styles.safeArea}  edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].icon} />
          </TouchableOpacity>
          
          <Typography size={18} weight="600" textType="textBold">
            Add Members
          </Typography>
          
          <View style={{ width: 24 }} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchField
            placeholder="Search for people to add..."
            onSearch={handleSearch}
          />
        </View>
        
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersContainer}>
            <Typography size={14} weight="500" color={Colors[theme].textLight} style={{ marginBottom: 8 }}>
              Selected ({selectedUsers.length})
            </Typography>
            <FlatList
              data={selectedUsers}
              renderItem={renderSelectedUser}
              keyExtractor={(item) => `selected-${item._id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedUsersContent}
            />
          </View>
        )}
        
        {/* Search Results */}
        <View style={styles.content}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.general.primary} />
              <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
                Searching users...
              </Typography>
            </View>
          ) : searchTerm && searchTerm.length > 0 ? (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => `search-${item._id}`}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={Colors[theme].textLight} />
                  <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                    No users found
                  </Typography>
                  <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                    Try searching with a different term
                  </Typography>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors[theme].textLight} />
              <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                Search for users to add
              </Typography>
              <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                Start typing to search for users in the database
              </Typography>
            </View>
          )}
        </View>
        
        {/* Add Button */}
        {selectedUsers.length > 0 && (
          <View style={styles.addButtonContainer}>
            <AppButton
              title={`Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
              handlePress={handleAddMembers}
              disabled={addMembersMutation.isPending}
              variant="primary"
            />
          </View>
        )}
      </SafeAreaView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    paddingBottom: 12,
  },
  backButton: {
    // padding: 4,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  selectedUsersContainer: {
    marginBottom: 16,
  },
  selectedUsersContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderColor + '40',
  },
  content: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderColor + '20',
  },
});

export default AddMembersScreen;