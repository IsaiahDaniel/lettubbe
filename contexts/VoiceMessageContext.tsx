import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

type AudioSound = import('expo-av/build/Audio/Sound').Sound;

interface VoiceMessageContextType {
  currentlyPlayingId: string | null;
  currentSound: AudioSound | null;
  setCurrentlyPlaying: (messageId: string | null, sound: AudioSound | null) => void;
  stopCurrentAudio: () => Promise<void>;
  isPlaying: (messageId: string) => boolean;
}

const VoiceMessageContext = createContext<VoiceMessageContextType | undefined>(undefined);

interface VoiceMessageProviderProps {
  children: ReactNode;
}

export const VoiceMessageProvider: React.FC<VoiceMessageProviderProps> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const currentSoundRef = useRef<AudioSound | null>(null);

  const setCurrentlyPlaying = (messageId: string | null, sound: AudioSound | null) => {
    setCurrentlyPlayingId(messageId);
    currentSoundRef.current = sound;
  };

  const stopCurrentAudio = async () => {
    if (currentSoundRef.current) {
      try {
        // Check if sound is loaded before trying to pause
        const status = await currentSoundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await currentSoundRef.current.pauseAsync();
        }
      } catch (error) {
        console.error('Error stopping current audio:', error);
      }
    }
    setCurrentlyPlayingId(null);
    currentSoundRef.current = null;
  };

  const isPlaying = (messageId: string) => {
    return currentlyPlayingId === messageId;
  };

  return (
    <VoiceMessageContext.Provider
      value={{
        currentlyPlayingId,
        currentSound: currentSoundRef.current,
        setCurrentlyPlaying,
        stopCurrentAudio,
        isPlaying,
      }}
    >
      {children}
    </VoiceMessageContext.Provider>
  );
};

export const useVoiceMessage = () => {
  const context = useContext(VoiceMessageContext);
  if (context === undefined) {
    throw new Error('useVoiceMessage must be used within a VoiceMessageProvider');
  }
  return context;
};