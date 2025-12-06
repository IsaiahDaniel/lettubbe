import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { ChatPreview } from '@/helpers/types/chat/chat.types';

interface ChatContextMenuProps {
  visible: boolean;
  onClose: () => void;
  chat: ChatPreview | null;
  onToggleFavorite: (chatId: string) => void;
  onToggleArchive: (chatId: string) => void;
  position: { x: number; y: number };
}

const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
  visible,
  onClose,
  chat,
  onToggleFavorite,
  onToggleArchive,
  position,
}) => {
  const { theme } = useCustomTheme();

  if (!visible || !chat) return null;

  const handleFavorite = () => {
    onToggleFavorite(chat._id);
    onClose();
  };

  const handleArchive = () => {
    onToggleArchive(chat._id);
    onClose();
  };

  // Calculate menu position with bounds checking
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dynamic width based on content
  const favoriteText = chat.isFavourite ? 'Remove from Favorites' : 'Add to Favorites';
  const archiveText = chat.isArchived ? 'Unarchive' : 'Archive';
  const longestText = favoriteText.length > archiveText.length ? favoriteText : archiveText;
  
  // Estimate width: icon (20) + margin (12) + text + padding (32) + extra margin (20)
  const estimatedTextWidth = longestText.length * 8.5; // Approximate character width
  const menuWidth = Math.max(220, estimatedTextWidth + 84); // Minimum 220px
  const menuHeight = 120; // Approximate height for 2 items
  
  let menuX = position.x;
  let menuY = position.y;
  
  // Ensure menu doesn't go off the right edge
  if (menuX + menuWidth > screenWidth) {
    menuX = screenWidth - menuWidth - 20;
  }
  
  // Ensure menu doesn't go off the bottom edge
  if (menuY + menuHeight > screenHeight) {
    menuY = position.y - menuHeight - 20; // Show above the touch point
  }
  
  // Ensure menu doesn't go off the left edge
  if (menuX < 20) {
    menuX = 20;
  }
  
  // Ensure menu doesn't go off the top edge
  if (menuY < 60) { // Account for status bar
    menuY = 60;
  }

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[
            styles.menuContainer,
            { 
              backgroundColor: Colors[theme].cardBackground,
              left: menuX,
              top: menuY,
              width: menuWidth,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleFavorite}
          >
            <Ionicons 
              name={chat.isFavourite ? "heart" : "heart-outline"} 
              size={20} 
              color={chat.isFavourite ? Colors.general.primary : Colors[theme].text} 
            />
            <Typography 
              size={16} 
              color={Colors[theme].text}
              style={styles.menuText}
            >
              {chat.isFavourite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Typography>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: Colors[theme].borderColor }]} />

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleArchive}
          >
            <Ionicons 
              name={chat.isArchived ? "unarchive-outline" : "archive-outline" as any} 
              size={20} 
              color={Colors[theme].text} 
            />
            <Typography 
              size={16} 
              color={Colors[theme].text}
              style={styles.menuText}
            >
              {chat.isArchived ? 'Unarchive' : 'Archive'}
            </Typography>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
});

export default ChatContextMenu;