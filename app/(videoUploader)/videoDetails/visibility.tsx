import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Typography from '@/components/ui/Typography/Typography';
import RemixIcon from 'react-native-remix-icon';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import useVideoUploadStore from '@/store/videoUploadStore';
import BackButton from '@/components/utilities/BackButton';

export default function VisibilityScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { videoDetails, setVideoDetails } = useVideoUploadStore();

  const handleSelectVisibility = (visibility: 'public' | 'subscribers' | 'private') => {
    setVideoDetails({ ...videoDetails, visibility });
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
          Visibility
        </Typography>
      </View>

      <View style={styles.content}>
        {/* Public Option */}
        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => handleSelectVisibility('public')}
        >
          <View style={styles.optionInfo}>
            <RemixIcon name="earth-line" size={22} color={Colors[theme].text} />
            <View style={styles.optionTextContainer}>
              <Typography size={16} weight="500">
                Public
              </Typography>
              <Typography size={13} weight="400" textType="secondary">
                Anyone on Lettube can view
              </Typography>
            </View>
          </View>
          <RadioButton selected={videoDetails.visibility === 'public'} />
        </TouchableOpacity>
        
        {/* Subscribers Option */}
        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => handleSelectVisibility('subscribers')}
        >
          <View style={styles.optionInfo}>
            <RemixIcon name="user-follow-line" size={22} color={Colors[theme].text} />
            <View style={styles.optionTextContainer}>
              <Typography size={16} weight="500">
                Just subscribers
              </Typography>
              <Typography size={13} weight="400" textType="secondary">
                Only your subscribers can see this post
              </Typography>
            </View>
          </View>
          <RadioButton selected={videoDetails.visibility === 'subscribers'} />
        </TouchableOpacity>
        
        {/* Private Option */}
        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => handleSelectVisibility('private')}
        >
          <View style={styles.optionInfo}>
            <RemixIcon name="lock-line" size={22} color={Colors[theme].text} />
            <View style={styles.optionTextContainer}>
              <Typography size={16} weight="500">
                Private
              </Typography>
              <Typography size={13} weight="400" textType="secondary">
                Choose who can view this post
              </Typography>
            </View>
          </View>
          <RadioButton selected={videoDetails.visibility === 'private'} />
        </TouchableOpacity>
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
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
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
});