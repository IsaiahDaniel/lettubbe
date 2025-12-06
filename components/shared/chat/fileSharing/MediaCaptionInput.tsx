import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';

interface MediaItem {
  uri: string;
  type: 'photo' | 'video' | 'audio';
}

interface MediaCaptionInputProps {
  mediaItems: MediaItem[];
  onSend: (caption: string) => void;
  onCancel: () => void;
}

const MediaCaptionInput: React.FC<MediaCaptionInputProps> = ({
  mediaItems,
  onSend,
  onCancel,
}) => {
  const { theme } = useCustomTheme();
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    onSend(caption);
  };

  return (
    <View
      style={{
        backgroundColor: Colors[theme].background,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors[theme].cardBackground,
      }}
    >
      {/* Media Preview */}
      <View
        style={{
          marginBottom: 12,
          padding: 8,
          backgroundColor: Colors[theme].cardBackground,
          borderRadius: 8,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: Colors[theme].cardBackground,
            borderRadius: 200,
            zIndex: 100,
          }}
        >
          {/* <Typography size={14} weight="600" color={Colors[theme].text}>
            {mediaItems.length} {mediaItems.length === 1 ? 'item' : 'items'} selected
          </Typography> */}
          <TouchableOpacity onPress={onCancel}>
            <Feather name="x" size={20} color={Colors[theme].textLight} />
          </TouchableOpacity>
        </View>
        
        {/* Horizontal scroll of media items */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 50 }}
        >
          {mediaItems.map((item, index) => (
            <View key={index} style={{ marginRight: 8 }}>
              {item.type === 'audio' ? (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: Colors[theme].cardBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Feather name="music" size={20} color={Colors[theme].text} />
                </View>
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    backgroundColor: Colors[theme].textLight,
                  }}
                />
              )}
              {/* Video indicator */}
              {item.type === 'video' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: 2,
                    padding: 1,
                  }}
                >
                  <Feather name="play" size={8} color="white" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Caption Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            fontSize: 16,
            minHeight: 40,
            maxHeight: 100,
            backgroundColor: Colors[theme].cardBackground,
            color: Colors[theme].textBold,
          }}
          placeholder="Add a caption..."
          placeholderTextColor={Colors[theme].textLight}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.general.primary,
            marginBottom: 2,
          }}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Feather name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MediaCaptionInput;