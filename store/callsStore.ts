import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallHistoryItem, CallSession, CallType, Contact, CallStatus, CallError } from '@/helpers/types/chat/call';
import { getPublicProfile } from '@/services/profile.service';
import { useGetUserIdState } from './UserStore';

// Update CallHistoryItem type to include favorite property
declare module '@/helpers/types/chat/call' {
  interface CallHistoryItem {
    favorite?: boolean;
  }
}

interface CallState {
  // Active call
  currentCall: CallSession | null;
  isIncomingCall: boolean;
  isSpeakerOn: boolean;
  localStreamEnabled: boolean;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  error: CallError | null;
  
  // Call history
  callHistory: CallHistoryItem[];

  // Actions - Call management
  initiateCall: (contactIds: string[], callType: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  
  // Actions - Call controls
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  
  // Actions - Call history
  clearCallHistory: () => void;
  deleteCallHistoryItem: (callId: string) => void;
  toggleFavorite: (callId: string) => void;
  
  // Actions - Call status management
  updateCallStatus: (status: CallStatus, updatedCall?: CallSession) => void;
  handleCallError: (error: CallError) => void;
  resetError: () => void;
  resetCallState: () => void;
}

// Creating a custom storage object using createJSONStorage
// I'm using a partial state type since we only store callHistory
type PersistedState = Pick<CallState, 'callHistory'>;
const customStorage = createJSONStorage<PersistedState>(() => ({
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Error getting item ${name} from AsyncStorage:`, error);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(name, jsonValue);
    } catch (error) {
      console.warn(`Error storing item ${name} in AsyncStorage:`, error);
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.warn(`Error removing item ${name} from AsyncStorage:`, error);
    }
  }
}));

const useCallStore = create<CallState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        currentCall: null,
        isIncomingCall: false,
        isSpeakerOn: false,
        localStreamEnabled: false,
        localVideoEnabled: false,
        localAudioEnabled: true,
        error: null,
        callHistory: [],
        
        // Actions - Call management
        initiateCall: async (contactIds, callType) => {
          try {
            // Reset any previous errors
            set({ error: null });
            
            // Generate a unique call ID
            const callId = `call-${Date.now()}`;
            
            // Get contact information from the API
            const contacts: Contact[] = await Promise.all(
              contactIds.map(async (id) => {
                try {
                  // Fetch user profile using the profile service
                  const response = await getPublicProfile(id);
                  const userData = response.data;
                  
                  if (!userData) {
                    throw new Error(`User with ID ${id} not found`);
                  }
                  
                  // Transform user data to Contact format
                  return {
                    id: userData._id || id,
                    name: userData.displayName || userData.firstName || `User ${id}`,
                    phoneNumber: userData.phoneNumber || '',
                    email: userData.email || '',
                    avatar: userData.profilePicture || '',
                    isSubscribed: userData.isSubscribed || false
                  };
                } catch (error) {
                  console.warn(`Error getting contact with ID ${id}:`, error);
                  
                  // Create a placeholder contact if API call fails
                  return {
                    id,
                    name: `User ${id}`,
                    phoneNumber: '',
                    email: '',
                    isSubscribed: false
                  };
                }
              })
            );
            
            // Get current user's profile as the local participant
            const userId = useGetUserIdState.getState().userId;
            let localUser: Contact = {
              id: userId || 'me',
              name: 'You',
              phoneNumber: '',
              email: '',
              isSubscribed: true
            };
            
            if (userId) {
              try {
                const userResponse = await getPublicProfile(userId);
                const userData = userResponse.data;
                
                if (userData) {
                  localUser = {
                    id: userData._id || userId,
                    name: userData.displayName || userData.firstName || 'You',
                    phoneNumber: userData.phoneNumber || '',
                    email: userData.email || '',
                    avatar: userData.profilePicture || '',
                    isSubscribed: true
                  };
                }
              } catch (error) {
                console.warn("Error getting current user profile:", error);
              }
            }
            
            // Create new call session
            const newCall: CallSession = {
              id: callId,
              type: callType,
              direction: 'outgoing',
              status: 'connecting',
              startTime: new Date(),
              participants: [
                // Local participant (me)
                {
                  contact: localUser,
                  muted: false,
                  videoEnabled: callType === 'video',
                  stream: undefined,
                  isLocal: true
                },
                // Remote participants
                ...contacts.map(contact => ({
                  contact,
                  muted: false,
                  videoEnabled: false,
                  stream: undefined,
                  isLocal: false
                }))
              ]
            };
            
            // Add to call history first, so it's available even if the next step fails
            const historyItem: CallHistoryItem = {
              id: callId,
              contactId: contactIds.length === 1 ? contactIds[0] : contactIds[0],
              type: callType,
              direction: 'outgoing',
              timestamp: new Date(),
              missed: false,
              groupCall: contactIds.length > 1,
              favorite: false
            };
            
            // Update state immediately in one operation to prevent race conditions
            set(state => ({
              currentCall: newCall,
              localVideoEnabled: callType === 'video',
              localAudioEnabled: true,
              localStreamEnabled: true,
              callHistory: [historyItem, ...state.callHistory]
            }));
            
            // Update status to ringing after a short delay
            setTimeout(() => {
              const { currentCall } = get();
              if (currentCall && currentCall.status !== 'ended') {
                get().updateCallStatus('ringing');
                
                // Automatically connect after another short delay for demo purposes
                setTimeout(() => {
                  const { currentCall: updatedCall } = get();
                  if (updatedCall && updatedCall.status === 'ringing') {
                    get().updateCallStatus('connected');
                  }
                }, 1500);
              }
            }, 1000);
            
          } catch (error) {
            console.error("Error in initiateCall:", error);
            
            set({ 
              error: { 
                code: 'INITIATE_FAILED', 
                message: error instanceof Error ? error.message : 'Failed to initiate call' 
              },
              currentCall: null,
              localStreamEnabled: false,
              localVideoEnabled: false,
              localAudioEnabled: true
            });
            
            throw error; // Re-throw so the UI can handle it
          }
        },
        
        answerCall: async () => {
          try {
            const { currentCall } = get();
            if (!currentCall) {
              throw new Error('No incoming call to answer');
            }
            
            // Update call state
            set(state => ({
              currentCall: state.currentCall ? {
                ...state.currentCall,
                status: 'connected',
                startTime: new Date()
              } : null,
              isIncomingCall: false,
              localStreamEnabled: true,
              localVideoEnabled: state.currentCall?.type === 'video',
              localAudioEnabled: true
            }));
            
            // Update call history
            const updatedCall = get().currentCall;
            if (updatedCall) {
              set(state => ({
                callHistory: state.callHistory.map(item => 
                  item.id === updatedCall.id 
                    ? { ...item, missed: false } 
                    : item
                )
              }));
            }
            
          } catch (error) {
            set({ 
              error: { 
                code: 'ANSWER_FAILED', 
                message: error instanceof Error ? error.message : 'Failed to answer call' 
              }
            });
            
            // End the failed call
            get().endCall();
          }
        },
        
        rejectCall: async () => {
          try {
            const { currentCall } = get();
            if (!currentCall) return;
            
            // Add to call history as missed
            if (currentCall.direction === 'incoming') {
              set(state => ({
                callHistory: state.callHistory.map(item => 
                  item.id === currentCall.id 
                    ? { ...item, missed: true } 
                    : item
                )
              }));
            }
            
            // Reset call state
            get().resetCallState();
            
          } catch (error) {
            set({ 
              error: { 
                code: 'REJECT_FAILED', 
                message: error instanceof Error ? error.message : 'Failed to reject call' 
              } 
            });
          }
        },
        
        endCall: async () => {
          try {
            const { currentCall } = get();
            if (!currentCall) return;
            
            // Update call history with duration
            const endTime = new Date();
            const duration = currentCall.startTime 
              ? Math.round((endTime.getTime() - currentCall.startTime.getTime()) / 1000) 
              : 0;
            
            set(state => ({
              callHistory: state.callHistory.map(item => 
                item.id === currentCall.id 
                  ? { ...item, duration } 
                  : item
              )
            }));
            
            // Reset call state
            get().resetCallState();
            
          } catch (error) {
            set({ 
              error: { 
                code: 'END_FAILED', 
                message: error instanceof Error ? error.message : 'Failed to end call' 
              } 
            });
            
            // Force reset call state even if there was an error
            get().resetCallState();
          }
        },
        
        // Actions - Call controls
        toggleMute: () => {
          // Update state
          set(state => ({ localAudioEnabled: !state.localAudioEnabled }));
          
          // Update participant state
          set(state => {
            if (!state.currentCall) return state;
            
            // Find the local participant and update their muted status
            return {
              currentCall: {
                ...state.currentCall,
                participants: state.currentCall.participants.map(p => 
                  p.isLocal ? { ...p, muted: !state.localAudioEnabled } : p
                )
              }
            };
          });
        },
        
        toggleSpeaker: () => {
          // Toggle speaker state
          set(state => ({ isSpeakerOn: !state.isSpeakerOn }));
        },
        
        toggleVideo: () => {
          // Update state
          set(state => ({ localVideoEnabled: !state.localVideoEnabled }));
          
          // Update participant state
          set(state => {
            if (!state.currentCall) return state;
            
            return {
              currentCall: {
                ...state.currentCall,
                participants: state.currentCall.participants.map(p => 
                  p.isLocal ? { ...p, videoEnabled: !state.localVideoEnabled } : p
                )
              }
            };
          });
        },
        
        switchCamera: () => {
          // placeholder for platform-specific camera switching
          console.log('Camera switch requested');
        },
        
        // Actions - Call history
        clearCallHistory: () => {
          set({ callHistory: [] });
        },
        
        deleteCallHistoryItem: (callId) => {
          set(state => ({
            callHistory: state.callHistory.filter(call => call.id !== callId)
          }));
        },
        
        toggleFavorite: (callId) => {
          set(state => ({
            callHistory: state.callHistory.map(call => 
              call.id === callId 
                ? { ...call, favorite: !call.favorite } 
                : call
            )
          }));
        },
        
        // Actions - Call status management
        updateCallStatus: (status, updatedCall) => {
          set(state => ({
            currentCall: updatedCall || (state.currentCall 
              ? { ...state.currentCall, status } 
              : null)
          }));
          
          // Handle specific status changes
          const { currentCall } = get();
          
          if (status === 'connected' && currentCall && !currentCall.startTime) {
            set(state => ({
              currentCall: state.currentCall 
                ? { ...state.currentCall, startTime: new Date() } 
                : null
            }));
          }
          
          if (status === 'ended') {
            if (currentCall && currentCall.startTime) {
              const endTime = new Date();
              const duration = Math.round((endTime.getTime() - currentCall.startTime.getTime()) / 1000);
              
              set(state => ({
                callHistory: state.callHistory.map(item => 
                  item.id === currentCall.id 
                    ? { ...item, duration } 
                    : item
                )
              }));
            }
            
            // Reset call state after a short delay to allow UI transitions
            setTimeout(() => {
              get().resetCallState();
            }, 500);
          }
        },
        
        handleCallError: (error) => {
          set({ error });
          
          // Log error for debugging
          console.error('Call error:', error);
          
          // Depending on the error, we might want to end the call
          if (['CONNECTION_FAILED', 'MEDIA_ERROR', 'PEER_CONNECTION_ERROR'].includes(error.code)) {
            get().endCall();
          }
        },
        
        resetError: () => {
          set({ error: null });
        },
        
        resetCallState: () => {
          set({
            currentCall: null,
            isIncomingCall: false,
            localStreamEnabled: false,
            localVideoEnabled: false,
            localAudioEnabled: true,
            isSpeakerOn: false,
            error: null
          });
        }
      }),
      {
        name: 'call-store',
        storage: customStorage,
        // need to only persist the callHistory property
        partialize: (state) => {
          // Only include callHistory in what gets saved to storage
          const { callHistory } = state;
          return { callHistory } as unknown as CallState;
        },
      }
    )
  )
);

export default useCallStore;