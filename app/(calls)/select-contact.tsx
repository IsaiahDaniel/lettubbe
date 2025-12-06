import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Phone, Video, Search, X, Mail, Plus } from 'lucide-react-native';
import useContactStore, { type ExtendedContact } from '@/store/contactStore';
import useCallStore from '@/store/callsStore';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import Avatar from '@/components/ui/Avatar';
import CustomBottomSheet from '@/components/ui/CustomBottomSheet';
import { useCustomTheme } from '@/hooks/useCustomTheme';

export default function SelectContactScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { 
    contacts, 
    filteredContacts,
    searchQuery,
    isLoading, 
    fetchContacts, 
    syncPhoneContacts,
    searchContacts,
    inviteContact,
    getSubscribedContacts
  } = useContactStore();
  const { initiateCall } = useCallStore();
  
  // Track selected contact IDs locally
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showCallOptions, setShowCallOptions] = useState(false);
  
  // Load contacts when screen mounts
  useEffect(() => {
    const loadData = async () => {
      // Try to fetch contacts first
      await fetchContacts();
      
      // If permission handler set up, also sync phone contacts
      try {
        await syncPhoneContacts();
      } catch (error) {
        console.log('Could not sync phone contacts:', error);
      }
    };
    
    loadData();
    
    // Clear selections when component unmounts
    return () => {
      setSelectedContactIds([]);
    };
  }, []);
  
  // Separate contacts into subscribed and non-subscribed (device contacts)
  const subscribedContacts = contacts.filter(contact => contact.isSubscribed);
  const deviceContacts = contacts.filter(contact => !contact.hasAccount);
  
  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };
  
  // Clear selected contacts
  const clearSelectedContacts = () => {
    setSelectedContactIds([]);
  };
  
  // Start a call with selected contacts
  const handleStartCall = async (callType: 'audio' | 'video') => {
    if (selectedContactIds.length === 0) return;
    
    try {
      await initiateCall(selectedContactIds, callType);
      router.push('/(calls)/ongoing-call');
    } catch (error) {
      console.error('Failed to start call:', error);
      // show error toast here
    }
  };
  
  // Show call options bottom sheet
  const handleShowCallOptions = () => {
    if (selectedContactIds.length === 0) return;
    setShowCallOptions(true);
  };
  
  // Cancel and go back
  const handleCancel = () => {
    clearSelectedContacts();
    router.back();
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    searchContacts(text);
  };

  // Invite a contact to the app
  const handleInviteContact = (contact: ExtendedContact) => {
    inviteContact(contact.id);
  };
  
  // Render header for each section
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeaderContainer}>
      <Typography 
        weight="600" 
        size={14} 
        textType="secondary"
        style={styles.sectionHeader}
      >
        {title}
      </Typography>
    </View>
  );
  
  // Render an individual contact item
  const renderContactItem = ({ item, isDeviceContact = false }: { item: ExtendedContact, isDeviceContact?: boolean }) => {
    const isSelected = selectedContactIds.includes(item.id);
    const contactMethod = item.phoneNumber || item.email || '';
    
    return (
      <TouchableOpacity 
        style={[
          styles.contactItem, 
          { backgroundColor: Colors[theme].background },
          isSelected && { backgroundColor: `${Colors.general.primary}15` }
        ]} 
        onPress={() => isDeviceContact ? null : toggleContactSelection(item.id)}
        activeOpacity={0.7}
        disabled={isDeviceContact}
      >
        <Avatar 
          uri 
          imageSource={item.avatar} 
          alt={item.name} 
          size={50} 
          ringColor={Colors[theme].avatar}
          showRing={isSelected}
        />
        
        <View style={styles.contactInfo}>
          <Typography weight="600" size={16} textType="textBold">
            {item.name}
          </Typography>
          
          <View style={styles.contactMethodContainer}>
            {item.phoneNumber && (
              <View style={styles.methodItem}>
                <Phone size={12} color={Colors[theme].secondary} style={styles.methodIcon} />
                <Typography size={14} textType="secondary">
                  {item.phoneNumber}
                </Typography>
              </View>
            )}
            
            {item.email && (
              <View style={styles.methodItem}>
                <Mail size={12} color={Colors[theme].secondary} style={styles.methodIcon} />
                <Typography size={14} textType="secondary">
                  {item.email}
                </Typography>
              </View>
            )}
            
            {item.status && (
              <View style={styles.methodItem}>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(item.status) }
                  ]} 
                />
                <Typography size={14} textType="secondary" style={{ textTransform: 'capitalize' }}>
                  {item.status}
                </Typography>
              </View>
            )}
          </View>
        </View>
        
        {isDeviceContact ? (
          <TouchableOpacity 
            style={styles.inviteButton} 
            onPress={() => handleInviteContact(item)}
          >
            <Plus size={18} color={Colors.general.blue} />
            <Typography size={14} color={Colors.general.blue} weight="600">
              Invite
            </Typography>
          </TouchableOpacity>
        ) : isSelected ? (
          <View style={styles.checkmark}>
            <Typography size={12} color="#fff" weight="bold">
              ✓
            </Typography>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Helper function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FFC107';
      case 'busy': return '#F44336';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]} edges={['top']}>
      <Stack.Screen 
        options={{
          title: 'Select Contact',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <X size={24} color={Colors.general.blue} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: Colors[theme].cardBackground }]}>
        <Search size={20} color={Colors[theme].secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: Colors[theme].textBold }]}
          placeholder="Search contacts"
          placeholderTextColor={Colors[theme].secondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      {/* List of contacts */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.general.blue} />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={(_, index) => `section-${index}`}
          renderItem={() => null}
          style={styles.contactsList}
          contentContainerStyle={styles.contactsListContent}
          ListHeaderComponent={() => (
            <>
              {subscribedContacts.length > 0 && (
                <>
                  {renderSectionHeader('Subscribed Contacts')}
                  {subscribedContacts.map(contact => (
                    <View key={contact.id}>
                      {renderContactItem({ item: contact })}
                    </View>
                  ))}
                </>
              )}
              
              {deviceContacts.length > 0 && (
                <>
                  {renderSectionHeader('Device Contacts')}
                  {deviceContacts.map(contact => (
                    <View key={contact.id}>
                      {renderContactItem({ item: contact, isDeviceContact: true })}
                    </View>
                  ))}
                </>
              )}
              
              {subscribedContacts.length === 0 && deviceContacts.length === 0 && (
                <View style={styles.emptyListContainer}>
                  <Typography style={styles.emptyListText} textType="secondary" size={16}>
                    {searchQuery ? 'No contacts found' : 'Your contacts will appear here'}
                  </Typography>
                </View>
              )}
            </>
          )}
        />
      )}
      
      {/* Bottom action bar */}
      {selectedContactIds.length > 0 && (
        <View style={[styles.actionBar, { 
          backgroundColor: Colors[theme].background,
          borderTopColor: Colors[theme].borderColor
        }]}>
          <Typography size={16} weight="500" textType="textBold">
            {selectedContactIds.length} {selectedContactIds.length === 1 ? 'contact' : 'contacts'} selected
          </Typography>
          
          <TouchableOpacity 
            style={[styles.callButton, { backgroundColor: Colors.general.primary }]}
            onPress={handleShowCallOptions}
          >
            <Typography size={16} weight="600" color="#fff">
              Continue
            </Typography>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Call Options Bottom Sheet */}
      <CustomBottomSheet
        isVisible={showCallOptions}
        onClose={() => setShowCallOptions(false)}
        title="Call Options"
        showClose={true}
        sheetheight="auto"
      >
        <View style={styles.callOptionsContainer}>
          <Typography size={16} weight="500" textType="textBold" style={styles.optionTitle}>
            How would you like to connect?
          </Typography>
          
          <View style={styles.callTypeButtons}>
            <TouchableOpacity 
              style={[styles.callTypeButton, { backgroundColor: Colors.general.primary }]}
              onPress={() => handleStartCall('audio')}
            >
              <Phone size={24} color="#fff" />
              <Typography size={16} weight="600" color="#fff" style={styles.callTypeText}>
                Audio Call
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.callTypeButton, { backgroundColor: Colors.general.blue }]}
              onPress={() => handleStartCall('video')}
            >
              <Video size={24} color="#fff" />
              <Typography size={16} weight="600" color="#fff" style={styles.callTypeText}>
                Video Call
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </CustomBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingBottom: 100, // Extra padding for the action bar
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactMethodContainer: {
    marginTop: 4,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  methodIcon: {
    marginRight: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.general.blue,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyListText: {
    textAlign: 'center',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  callButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callOptionsContainer: {
    padding: 16,
  },
  optionTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  callTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callTypeButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTypeText: {
    marginTop: 8,
  },
});