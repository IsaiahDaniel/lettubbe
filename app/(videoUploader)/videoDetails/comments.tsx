import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import useVideoUploadStore from '@/store/videoUploadStore';
import BackButton from '@/components/utilities/BackButton';

export default function CommentsScreen() {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { videoDetails, setVideoDetails } = useVideoUploadStore();

  const toggleComments = (isCommentsAllowed: boolean) => {
    setVideoDetails({ ...videoDetails, isCommentsAllowed });
  };

  const RadioButton = ({ selected }: { selected: boolean }) => {
    if (selected) {
      return (
        <View style={styles.radioOuterSelected}>
          <View style={styles.radioInnerSelected} />
        </View>
      );
    }
    return <View style={styles.radioUnselected} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <BackButton />
        <Typography size={17} weight="600">
          Comments
        </Typography>
      </View>

      <View style={styles.content}>
        {/* Option selection section */}
        <View style={styles.optionsContainer}>
          {/* ON option */}
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => toggleComments(true)}
          >
            <Typography size={16} weight="500">
              On
            </Typography>
            <RadioButton selected={videoDetails.isCommentsAllowed === true} />
          </TouchableOpacity>
          
          {/* OFF option */}
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => toggleComments(false)}
          >
            <Typography size={16} weight="500">
              Off
            </Typography>
            <RadioButton selected={videoDetails.isCommentsAllowed === false} />
          </TouchableOpacity>
        </View>

        {/* Additional information can be added here if needed */}
        <View style={styles.infoContainer}>
          {videoDetails.isCommentsAllowed ? (
            <Typography size={14} weight="400" textType="secondary" style={styles.infoText}>
              Viewers will be able to comment on your video
            </Typography>
          ) : (
            <Typography size={14} weight="400" textType="secondary" style={styles.infoText}>
              Viewers will not be able to comment on your video
            </Typography>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  radioOuterSelected: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioInnerSelected: {
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#00D26A',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  infoText: {
    color: '#666',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  doneButton: {
    backgroundColor: '#00D26A',
    borderRadius: 18,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
  },
});