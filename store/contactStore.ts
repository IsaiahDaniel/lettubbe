import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Contact } from '@/helpers/types/chat/call';
import * as Contacts from 'expo-contacts';

// Status type for contacts
export type ContactStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

// Extended Contact type with additional properties
interface ExtendedContact extends Contact {
  status?: ContactStatus;
  hasAccount: boolean;
  hasInteracted: boolean;
  lastInteraction?: Date;
  lastSeen?: Date;
  isFavorite: boolean;
  inviteSent?: boolean;
  phoneNumbers?: { number: string, label: string }[];
}

// Mock data
const mockContacts: ExtendedContact[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    phoneNumbers: [{ number: '+1234567890', label: 'mobile' }],
    email: 'john.doe@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    status: 'online',
    hasAccount: true,
    hasInteracted: true,
    lastInteraction: new Date(Date.now() - 3600000), // 1 hour ago
    lastSeen: new Date(),
    isFavorite: true,
    isSubscribed: true
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    phoneNumber: '+1987654321',
    phoneNumbers: [{ number: '+1987654321', label: 'mobile' }],
    email: 'jane.smith@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    status: 'offline',
    hasAccount: true,
    hasInteracted: true,
    lastInteraction: new Date(Date.now() - 86400000), // 1 day ago
    lastSeen: new Date(Date.now() - 7200000), // 2 hours ago
    isFavorite: false,
    isSubscribed: true
  },
  {
    id: 'user-3',
    name: 'Robert Johnson',
    phoneNumber: '+1122334455',
    phoneNumbers: [{ number: '+1122334455', label: 'mobile' }],
    email: 'robert.johnson@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    status: 'away',
    hasAccount: true,
    hasInteracted: false,
    lastSeen: new Date(Date.now() - 172800000), // 2 days ago
    isFavorite: false,
    isSubscribed: true
  },
  {
    id: 'user-4',
    name: 'Emily Brown',
    phoneNumber: '+1555666777',
    phoneNumbers: [{ number: '+1555666777', label: 'mobile' }],
    email: 'emily.brown@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    hasAccount: true,
    hasInteracted: false,
    isFavorite: false,
    isSubscribed: false
  },
  {
    id: 'user-5',
    name: 'Michael Davis',
    phoneNumber: '+1999888777',
    phoneNumbers: [{ number: '+1999888777', label: 'mobile' }],
    email: 'michael.davis@example.com',
    hasAccount: false,
    hasInteracted: false,
    isFavorite: false,
    isSubscribed: false
  },
  {
    id: 'user-6',
    name: 'Sarah Wilson',
    phoneNumber: '+1444333222',
    phoneNumbers: [{ number: '+1444333222', label: 'mobile' }],
    email: 'sarah.wilson@example.com',
    hasAccount: false,
    hasInteracted: false,
    isFavorite: false,
    isSubscribed: false
  }
];

// define the permissions handler
interface PermissionsHandler {
  requestContactsPermission: () => Promise<boolean>;
}

interface ContactStore {
  // Contact lists
  contacts: ExtendedContact[];
  interactedContacts: ExtendedContact[];
  appContacts: ExtendedContact[];
  nonAppContacts: ExtendedContact[];
  
  // Search and filter state
  searchQuery: string;
  filteredContacts: ExtendedContact[];
  
  // Action states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Profile information for the current user
  userProfile: ExtendedContact | null;
  
  // Permissions handler
  permissionsHandler: PermissionsHandler | null;
  
  // Set permissions handler
  setPermissionsHandler: (handler: PermissionsHandler) => void;
  
  // Actions
  fetchContacts: () => Promise<void>;
  loadContacts: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  syncPhoneContacts: () => Promise<void>;
  searchContacts: (query: string) => void;
  
  // Contact management
  addContact: (contact: ExtendedContact) => void;
  updateContact: (id: string, updates: Partial<ExtendedContact>) => void;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleSubscription: (id: string) => void;
  
  // Contact getters
  getContactById: (id: string) => ExtendedContact | undefined;
  getFavoriteContacts: () => ExtendedContact[];
  getRecentContacts: (limit?: number) => ExtendedContact[];
  getSubscribedContacts: () => ExtendedContact[];
  
  // Invite functions
  inviteContact: (id: string) => Promise<void>;
  
  // Helper functions 
  clearError: () => void;
  sortByInteractionDate: (contacts: ExtendedContact[]) => ExtendedContact[];
  
  // For development and testing
  populateMockData: () => void;
  
  // Reset store
  reset: () => void;
}

const useContactStore = create<ContactStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        contacts: [],
        interactedContacts: [],
        appContacts: [],
        nonAppContacts: [],
        filteredContacts: [],
        searchQuery: '',
        isLoading: false,
        isRefreshing: false,
        error: null,
        userProfile: null,
        permissionsHandler: null,
        
        // Set the permissions handler
        setPermissionsHandler: (handler) => {
          set({ permissionsHandler: handler });
        },
        
        // Mock data
        populateMockData: () => {
          set({ 
            contacts: [...mockContacts],
            isLoading: false,
            error: null
          });
          
          // Process the contacts after setting them
          const state = get();
          const interactedContacts = mockContacts.filter(contact => contact.hasInteracted);
          const appContacts = mockContacts.filter(contact => contact.hasAccount && !contact.hasInteracted);
          const nonAppContacts = mockContacts.filter(contact => !contact.hasAccount);
          
          set({
            interactedContacts: state.sortByInteractionDate(interactedContacts),
            appContacts,
            nonAppContacts,
            filteredContacts: [...mockContacts]
          });
        },
        
        // Fetch contacts from API and local storage
        fetchContacts: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // In the live app, I'd fetch contacts from the API here
            // const response = await api.getContacts();
            // const contacts = response.data;
            
            // For now, use mock data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API delay
            const contacts = [...mockContacts];
            
            // Process contacts and update state
            const interactedContacts = contacts.filter(contact => contact.hasInteracted);
            const appContacts = contacts.filter(contact => contact.hasAccount && !contact.hasInteracted);
            const nonAppContacts = contacts.filter(contact => !contact.hasAccount);
            
            set({
              contacts,
              interactedContacts: get().sortByInteractionDate(interactedContacts),
              appContacts,
              nonAppContacts,
              filteredContacts: contacts,
              isLoading: false
            });
            
          } catch (error) {
            console.error('Error fetching contacts:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to fetch contacts' 
            });
          }
        },

        // Load contacts (alias for fetchContacts for compatibility)
        loadContacts: async () => {
          return get().fetchContacts();
        },
        
        // Refresh contacts (for pull-to-refresh)
        refreshContacts: async () => {
          try {
            set({ isRefreshing: true, error: null });
            
            await get().fetchContacts();
            
            set({ isRefreshing: false });
          } catch (error) {
            set({ 
              isRefreshing: false, 
              error: error instanceof Error ? error.message : 'Failed to refresh contacts' 
            });
          }
        },
        
        // Sync with phone contacts
        syncPhoneContacts: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Get the permissions handler
            const permissionsHandler = get().permissionsHandler;
            if (!permissionsHandler) {
              throw new Error('Permissions handler not set');
            }
            
            // Request permission to access contacts using the handler
            const permissionGranted = await permissionsHandler.requestContactsPermission();
            
            if (!permissionGranted) {
              throw new Error('Permission to access contacts was denied');
            }
            
            // Get phone contacts
            const { data } = await Contacts.getContactsAsync({
              fields: [
                Contacts.Fields.PhoneNumbers,
                Contacts.Fields.Emails,
                Contacts.Fields.Image,
                Contacts.Fields.Name
              ]
            });
            
            if (data.length > 0) {
              // Transform phone contacts to our app's Contact format
              const phoneContacts = data.map(contact => {
                // Get the first available phone number, or use empty string if none exists
                const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0 ? 
                  contact.phoneNumbers[0].number || '' : '';
                
                const email = contact.emails && contact.emails.length > 0 ? 
                  contact.emails[0].email || '' : '';
                
                // map phone numbers, ensuring all numbers are strings
                const phoneNumbers = contact.phoneNumbers ? 
                  contact.phoneNumbers
                    .filter(p => p.number) // Filter out any undefined numbers
                    .map(p => ({ 
                      number: p.number || '', // Ensure number is never undefined
                      label: p.label || 'other' 
                    })) : 
                  [];
                
                return {
                  id: `phone-${contact.id}`,
                  name: contact.name || 'Unknown',
                  phoneNumber: phoneNumber,
                  phoneNumbers: phoneNumbers,
                  email: email,
                  avatar: contact.image?.uri || '',
                  hasAccount: false, // This will be updated after checking with API
                  hasInteracted: false,
                  isFavorite: false,
                  isSubscribed: false
                } as ExtendedContact;
              });
              
              // In the live app, check with API which phone contacts have accounts
              // For now, just simulate the process
              await new Promise(resolve => setTimeout(resolve, 300)); // Mock API delay
              
              // Merge with existing contacts
              const currentContacts = get().contacts;
              const mergedContacts = [...currentContacts];
              
              // This is a simplistic merge - in the live app, I'd need more sophisticated logic
              phoneContacts.forEach(phoneContact => {
                const existingContact = currentContacts.find(c => 
                  (c.phoneNumber && phoneContact.phoneNumber && 
                   c.phoneNumber === phoneContact.phoneNumber) ||
                  (c.email && phoneContact.email && c.email === phoneContact.email)
                );
                
                if (!existingContact) {
                  mergedContacts.push(phoneContact);
                }
              });
              
              // Process the merged contacts
              const interactedContacts = mergedContacts.filter(contact => contact.hasInteracted);
              const appContacts = mergedContacts.filter(contact => contact.hasAccount && !contact.hasInteracted);
              const nonAppContacts = mergedContacts.filter(contact => !contact.hasAccount);
              
              set({
                contacts: mergedContacts,
                interactedContacts: get().sortByInteractionDate(interactedContacts),
                appContacts,
                nonAppContacts,
                filteredContacts: mergedContacts,
                isLoading: false
              });
            }
            
          } catch (error) {
            console.error('Error syncing phone contacts:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to sync phone contacts' 
            });
          }
        },
        
        // Search contacts by name, phone, or email
        searchContacts: (query) => {
          set({ searchQuery: query });
          
          if (!query.trim()) {
            set({ filteredContacts: get().contacts });
            return;
          }
          
          const normalizedQuery = query.toLowerCase().trim();
          const filtered = get().contacts.filter(contact => {
            const matchName = contact.name?.toLowerCase().includes(normalizedQuery);
            const matchPhone = contact.phoneNumber?.replace(/[^0-9]/g, '').includes(normalizedQuery.replace(/[^0-9]/g, ''));
            const matchEmail = contact.email?.toLowerCase().includes(normalizedQuery);
            
            return matchName || matchPhone || matchEmail;
          });
          
          set({ filteredContacts: filtered });
        },
        
        // Add a new contact
        addContact: (contact) => {
          // In the live app, make an API call here
          set(state => {
            const updatedContacts = [...state.contacts, contact];
            
            // Update appropriate category lists
            let updatedInteractedContacts = [...state.interactedContacts];
            let updatedAppContacts = [...state.appContacts];
            let updatedNonAppContacts = [...state.nonAppContacts];
            
            if (contact.hasInteracted) {
              updatedInteractedContacts.push(contact);
              updatedInteractedContacts = state.sortByInteractionDate(updatedInteractedContacts);
            } else if (contact.hasAccount) {
              updatedAppContacts.push(contact);
            } else {
              updatedNonAppContacts.push(contact);
            }
            
            return {
              contacts: updatedContacts,
              interactedContacts: updatedInteractedContacts,
              appContacts: updatedAppContacts,
              nonAppContacts: updatedNonAppContacts,
              filteredContacts: state.searchQuery ? state.filteredContacts : updatedContacts
            };
          });
        },
        
        // Update an existing contact
        updateContact: (id, updates) => {
          set(state => {
            const index = state.contacts.findIndex(c => c.id === id);
            if (index === -1) return state;
            
            const updatedContacts = [...state.contacts];
            const oldContact = updatedContacts[index];
            const updatedContact = { ...oldContact, ...updates };
            updatedContacts[index] = updatedContact;
            
            // Handle category changes if needed
            let updatedInteractedContacts = [...state.interactedContacts];
            let updatedAppContacts = [...state.appContacts];
            let updatedNonAppContacts = [...state.nonAppContacts];
            
            // If interaction status changed
            if ('hasInteracted' in updates && updates.hasInteracted !== oldContact.hasInteracted) {
              if (updates.hasInteracted) {
                // Moving to interacted contacts
                updatedInteractedContacts = [
                  ...updatedInteractedContacts.filter(c => c.id !== id),
                  updatedContact
                ];
                updatedInteractedContacts = state.sortByInteractionDate(updatedInteractedContacts);
                updatedAppContacts = updatedAppContacts.filter(c => c.id !== id);
                updatedNonAppContacts = updatedNonAppContacts.filter(c => c.id !== id);
              } else if (updatedContact.hasAccount) {
                // Moving from interacted to app contacts
                updatedInteractedContacts = updatedInteractedContacts.filter(c => c.id !== id);
                updatedAppContacts = [...updatedAppContacts.filter(c => c.id !== id), updatedContact];
              } else {
                // Moving from interacted to non-app contacts
                updatedInteractedContacts = updatedInteractedContacts.filter(c => c.id !== id);
                updatedNonAppContacts = [...updatedNonAppContacts.filter(c => c.id !== id), updatedContact];
              }
            }
            
            // If account status changed
            if ('hasAccount' in updates && updates.hasAccount !== oldContact.hasAccount) {
              if (updates.hasAccount) {
                // Moving to app contacts
                updatedNonAppContacts = updatedNonAppContacts.filter(c => c.id !== id);
                if (!updatedContact.hasInteracted) {
                  updatedAppContacts = [...updatedAppContacts.filter(c => c.id !== id), updatedContact];
                }
              } else {
                // Moving to non-app contacts
                updatedAppContacts = updatedAppContacts.filter(c => c.id !== id);
                if (!updatedContact.hasInteracted) {
                  updatedNonAppContacts = [...updatedNonAppContacts.filter(c => c.id !== id), updatedContact];
                }
              }
            }
            
            return {
              contacts: updatedContacts,
              interactedContacts: updatedInteractedContacts,
              appContacts: updatedAppContacts,
              nonAppContacts: updatedNonAppContacts,
              filteredContacts: state.searchQuery 
                ? state.filteredContacts.map(c => c.id === id ? updatedContact : c)
                : updatedContacts
            };
          });
        },
        
        // Remove a contact
        removeContact: (id) => {
          set(state => ({
            contacts: state.contacts.filter(c => c.id !== id),
            interactedContacts: state.interactedContacts.filter(c => c.id !== id),
            appContacts: state.appContacts.filter(c => c.id !== id),
            nonAppContacts: state.nonAppContacts.filter(c => c.id !== id),
            filteredContacts: state.filteredContacts.filter(c => c.id !== id)
          }));
        },
        
        // Toggle favorite status
        toggleFavorite: (id) => {
          const contact = get().getContactById(id);
          if (contact) {
            get().updateContact(id, { isFavorite: !contact.isFavorite });
          }
        },
        
        // Toggle subscription status
        toggleSubscription: (id) => {
          const contact = get().getContactById(id);
          if (contact) {
            get().updateContact(id, { isSubscribed: !contact.isSubscribed });
          }
        },
        
        // Get contact by ID
        getContactById: (id) => {
          return get().contacts.find(c => c.id === id);
        },
        
        // Get favorite contacts
        getFavoriteContacts: () => {
          return get().contacts.filter(c => c.isFavorite);
        },
        
        // Get recent contacts sorted by last interaction
        getRecentContacts: (limit = 10) => {
          return get().sortByInteractionDate(
            get().contacts.filter(c => c.lastInteraction)
          ).slice(0, limit);
        },
        
        // Get subscribed contacts
        getSubscribedContacts: () => {
          return get().contacts.filter(c => c.isSubscribed);
        },
        
        // Invite a contact to join the app
        inviteContact: async (id) => {
          try {
            const contact = get().getContactById(id);
            if (!contact) {
              throw new Error('Contact not found');
            }
            
            // In the live app, make an API call here to send an invitation
            await new Promise(resolve => setTimeout(resolve, 300)); // Mock API delay
            
            // For now, just update the local state to reflect invite being sent
            get().updateContact(id, { inviteSent: true });
            
            
          } catch (error) {
            console.error('Error inviting contact:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to invite contact' 
            });
          }
        },
        
        // Clear error
        clearError: () => {
          set({ error: null });
        },
        
        // Sort contacts by last interaction date
        sortByInteractionDate: (contacts) => {
          return [...contacts].sort((a, b) => {
            // If both have lastInteraction, sort by date (newer first)
            if (a.lastInteraction && b.lastInteraction) {
              return b.lastInteraction.getTime() - a.lastInteraction.getTime();
            }
            
            // If only one has lastInteraction, it comes first
            if (a.lastInteraction) return -1;
            if (b.lastInteraction) return 1;
            
            // If neither has lastInteraction, sort by name
            return a.name.localeCompare(b.name);
          });
        },
        
        // Reset store to initial state
        reset: () => set({
          contacts: [],
          interactedContacts: [],
          appContacts: [],
          nonAppContacts: [],
          filteredContacts: [],
          searchQuery: '',
          isLoading: false,
          isRefreshing: false,
          error: null,
          userProfile: null,
          permissionsHandler: null
        })
      }),
      {
        name: 'contact-store',
        partialize: (state) => ({ 
          contacts: state.contacts,
          userProfile: state.userProfile
        })
      }
    )
  )
);

export default useContactStore;
export type { ExtendedContact };