import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';

type CommentOption = {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
};

type CommentOptionsProps = {
  visible: boolean;
  onClose: () => void;
  options: CommentOption[];
  position?: { x: number; y: number };
};

const CommentOptions = ({ visible, onClose, options, position }: CommentOptionsProps) => {
  const { theme } = useCustomTheme();
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const windowWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    if (position) {
      // Determine the best position for the menu soit stays on screen
      // Default to showing at the touch position
      const menuLeft = Math.min(position.x, windowWidth - 220); // to nsure menu doesn't go off right edge
      
      setMenuPosition({
        top: position.y,
        left: menuLeft,
      });
    }
  }, [position, windowWidth]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[
            styles.optionsContainer, 
            { 
              backgroundColor: Colors[theme].cardBackground,
              top: menuPosition.top,
              left: menuPosition.left
            }
          ]}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionItem}
              onPress={() => {
                option.onPress();
                onClose();
              }}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={option.color || Colors[theme].text} 
              />
              <Typography 
                size={14} 
                weight="500" 
                color={option.color || Colors[theme].text}
                style={styles.optionText}
              >
                {option.label}
              </Typography>
            </TouchableOpacity>
          ))}
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
  optionsContainer: {
    position: 'absolute',
    width: 200,
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionText: {
    marginLeft: 12,
  }
});

export default CommentOptions;