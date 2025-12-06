import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useContactStore from '@/store/contactStore';
import useCallStore from '@/store/callsStore';
import { Contact } from '@/helpers/types/chat/call';
import BackButton from '@/components/utilities/BackButton';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

export default function AddFavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contacts, isLoading, loadContacts } = useContactStore();
  const { callHistory, toggleFavorite } = useCallStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useCustomTheme();
  
  // Get unique contacts from call history
  const callContacts = React.useMemo(() => {
    const contactMap = new Map<string, {contact: Contact, isFavorite: boolean}>();
    
    callHistory.forEach(call => {
      const contact = contacts.find(c => c.id === call.contactId);
      if (contact) {
        const existing = contactMap.get(contact.id);
        if (existing) {
          // If this call is favorite but the existing one isn't, update favorite status
          if (call.favorite && !existing.isFavorite) {
            contactMap.set(contact.id, { contact, isFavorite: true });
          }
        } else {
          contactMap.set(contact.id, { contact, isFavorite: call.favorite || false });
        }
      }
    });
    
    return Array.from(contactMap.values());
  }, [callHistory, contacts]);
  
  // Filter contacts based on search query
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) return callContacts;
    
    const query = searchQuery.toLowerCase();
    return callContacts.filter(item => 
      item.contact.name.toLowerCase().includes(query) ||
      (item.contact.phoneNumber && item.contact.phoneNumber.includes(query))
    );
  }, [callContacts, searchQuery]);
  
  // Load contacts if needed
  useEffect(() => {
    if (contacts.length === 0 && !isLoading) {
      loadContacts();
    }
  }, [contacts.length, loadContacts, isLoading]);
  
  const handleToggleFavorite = (contactId: string) => {
    // Find most recent call for this contact
    const mostRecentCall = callHistory
      .filter(call => call.contactId === contactId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (mostRecentCall) {
      toggleFavorite(mostRecentCall.id);
    }
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top, backgroundColor: Colors[theme].background }]}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
        <Typography color={Colors[theme].textLight} style={styles.loadingText}>
          Loading contacts...
        </Typography>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: Colors[theme].background }]}>
      <View style={[styles.header, { borderBottomColor: Colors[theme].borderColor }]}>
        <BackButton />
        <Typography weight="600" size={18} textType="textBold">Add Favorites</Typography>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: Colors[theme].inputBackground }]}>
        <MaterialIcons name="search" size={24} color={Colors[theme].icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: Colors[theme].text }]}
          placeholder="Search contacts"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors[theme].textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="cancel" size={20} color={Colors[theme].icon} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.contact.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.contactItem, { borderBottomColor: Colors[theme].borderColor }]}
            onPress={() => handleToggleFavorite(item.contact.id)}
          >
            <View style={styles.contactInfo}>
              {item.contact.avatar ? (
                <Image source={{ uri: item.contact.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: Colors.general.primary }]}>
                  <Typography color="#FFFFFF" weight="bold" size={18}>
                    {item.contact.name.charAt(0)}
                  </Typography>
                </View>
              )}
              <Typography textType="text" size={16}>
                {item.contact.name}
              </Typography>
            </View>
            
            <MaterialIcons 
              name={item.isFavorite ? "favorite" : "favorite-outline"} 
              size={24} 
              color={item.isFavorite ? Colors.general.error : Colors[theme].icon} 
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Typography textType="secondary" size={16}>
              No contacts found
            </Typography>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});