import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AudioState {
  isGloballyMuted: boolean;
  toggleGlobalMute: () => void;
  setGlobalMute: (muted: boolean) => void;
  initializeAudioState: () => void;
}

const AUDIO_STORAGE_KEY = '@lettubbe_global_audio_muted';

export const useAudioStore = create<AudioState>((set, get) => ({
  // Default to muted (social media best practice)
  isGloballyMuted: true,

  toggleGlobalMute: () => {
    const newMutedState = !get().isGloballyMuted;
    set({ isGloballyMuted: newMutedState });
    
    // Persist to AsyncStorage
    AsyncStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(newMutedState)).catch(error => {
      console.warn('Failed to save audio state to storage:', error);
    });
  },

  setGlobalMute: (muted: boolean) => {
    set({ isGloballyMuted: muted });
    
    // Persist to AsyncStorage
    AsyncStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(muted)).catch(error => {
      console.warn('Failed to save audio state to storage:', error);
    });
  },

  initializeAudioState: async () => {
    try {
      const storedState = await AsyncStorage.getItem(AUDIO_STORAGE_KEY);
      if (storedState !== null) {
        const isGloballyMuted = JSON.parse(storedState);
        set({ isGloballyMuted });
      }
      // If no stored state, keep default (muted)
    } catch (error) {
      console.warn('Failed to load audio state from storage:', error);
      // Keep default state on error
    }
  },
}));