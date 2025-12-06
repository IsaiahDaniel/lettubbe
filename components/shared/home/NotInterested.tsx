import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "@/components/ui/Typography/Typography";
import Toast from "react-native-toast-message";
import { toggleNotInterested } from "@/services/report.service";

interface NotInterestedBottomSheetProps {
  videoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type OptionId = 'irrelevant' | 'boring' | 'sexual_content' | 'disgusting' | 'violence' | 'offensive' | 'misleading' | 'other';
type CategoryValue = 'other' | 'sexual_content' | 'violence' | 'hate_speech' | 'spam';

// Options for not interested categories
const notInterestedOptions = [
  { id: "irrelevant" as OptionId, label: "Irrelevant" },
  { id: "boring" as OptionId, label: "Boring" },
  { id: "sexual_content" as OptionId, label: "Too sexual" },
  { id: "disgusting" as OptionId, label: "Disgusting" },
  { id: "violence" as OptionId, label: "Violent" },
  { id: "offensive" as OptionId, label: "Offensive" },
  { id: "misleading" as OptionId, label: "Misleading" },
  { id: "other" as OptionId, label: "Other" },
];

const categoryMapping: Record<OptionId, CategoryValue> = {
  irrelevant: "other",
  boring: "other",
  sexual_content: "sexual_content",
  disgusting: "other",
  violence: "violence",
  offensive: "hate_speech",
  misleading: "spam",
  other: "other",
};

const NotInterestedBottomSheet: React.FC<NotInterestedBottomSheetProps> = ({
  videoId,
  onClose,
  onSuccess,
}) => {
  const { theme } = useCustomTheme();
  const [selectedOption, setSelectedOption] = useState<OptionId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOptionSelect = async (optionId: OptionId) => {
    setSelectedOption(optionId);
    
    try {
      setIsSubmitting(true);
      
      const response = await toggleNotInterested(videoId, {
        category: categoryMapping[optionId],
        reason: notInterestedOptions.find(option => option.id === optionId)?.label || "Other"
      });
      
      Toast.show({
        type: 'success',
        text1: "You'll see fewer videos like this.",
        text2: 'Tap to undo',
        onPress: handleUndo,
        visibilityTime: 4000,
        position: 'bottom',
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error marking content as not interested:', error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again later',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    try {
      await toggleNotInterested(videoId);
      
      Toast.show({
        type: 'info',
        text1: 'Preference removed',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error undoing not interested status:', error);
    }
  };

  return (        
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Typography 
        textType="textBold" 
        weight="600" 
        style={styles.title}
      >
        Tell us why you're not interested
      </Typography>
      
      <View style={styles.optionsContainer}>
        {notInterestedOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              {
                backgroundColor: Colors[theme].cardBackground,
                borderColor: selectedOption === option.id 
                  ? Colors.general.primary 
                  : Colors[theme].cardBackground,
              },
            ]}
            disabled={isSubmitting}
            onPress={() => handleOptionSelect(option.id)}
          >
            <Typography 
              textType="text" 
              weight="500"
              style={selectedOption === option.id ? { color: Colors.general.primary } : {}}
            >
              {option.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
});

export default NotInterestedBottomSheet;