import React from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import useVideoUploadStore from '@/store/videoUploadStore';
import BackButton from '@/components/utilities/BackButton';
import AppButton from '@/components/ui/AppButton';
import { useRouter } from 'expo-router';
import MentionInput from '@/components/ui/inputs/MentionInput';

export default function DescriptionScreen() {
  const { theme } = useCustomTheme();
  const { videoDetails, setVideoDetails, postDetails, setPostDetails, uploadMode } = useVideoUploadStore();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: "center", gap: 12 }}>
          <BackButton/>
          <Typography size={18} style={{ marginLeft: 10 }} weight="600">
            Add description
          </Typography>

        </View>

          <AppButton
            title="Done" 
            variant="compact" 
            handlePress={() => router.back()}
            style={{ marginRight: 8 }}
          />

      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <MentionInput
            value={uploadMode === 'video' ? videoDetails.description : postDetails.description}
            onChangeText={(text) => {
              if (uploadMode === 'video') {
                setVideoDetails({ description: text });
              } else {
                setPostDetails({ description: text });
              }
            }}
            onMentionsChange={(mentions) => {
              if (uploadMode === 'video') {
                setVideoDetails({ mentions });
              } else {
                setPostDetails({ mentions });
              }
            }}
            placeholder={`what's on your mind...`}
            style={[
              styles.textAreaInput, 
              { 
                backgroundColor: Colors[theme].inputBackground,
                borderColor: Colors[theme].borderColor,
              }
            ]}
            maxLength={500}
          />
          
          <Typography size={14} weight="400" textType="secondary" style={styles.helper}>
            A good description helps viewers find your {uploadMode === 'video' ? 'video' : 'photos'} in search results
          </Typography>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textAreaInput: {
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  helper: {
    marginTop: 12,
  },
});