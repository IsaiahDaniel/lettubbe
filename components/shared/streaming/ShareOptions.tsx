import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  onPress: () => void;
}

interface ShareOptionsProps {
  onChatPress: () => void;
  onWhatsAppPress: () => void;
  onTwitterPress: () => void;
  onTelegramPress: () => void;
  onMorePress: () => void;
}

const ShareOptions: React.FC<ShareOptionsProps> = ({
  onChatPress,
  onWhatsAppPress,
  onTwitterPress,
  onTelegramPress,
  onMorePress,
}) => {
  const { theme } = useCustomTheme();

  const shareOptions: ShareOption[] = [
    { id: 'chat', name: 'Chat', icon: 'chatbubble-outline', onPress: onChatPress },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', onPress: onWhatsAppPress },
    { id: 'twitter', name: 'X', icon: 'logo-twitter', onPress: onTwitterPress },
    { id: 'telegram', name: 'Telegram', icon: 'paper-plane-outline', onPress: onTelegramPress },
    { id: 'more', name: 'More', icon: 'share-outline', onPress: onMorePress },
  ];

  return (
    <View style={styles.container}>
      <Typography weight="600" size={14} textType="textBold" style={styles.title}>
        Share with
      </Typography>
      <View style={styles.optionsContainer}>
        {shareOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={option.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors[theme].inputBackground }]}>
              <Ionicons name={option.icon as any} size={24} color={Colors[theme].textBold} />
            </View>
            <Typography size={11} style={styles.optionText} numberOfLines={1}>
              {option.name}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 0,
  },
  option: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ShareOptions;