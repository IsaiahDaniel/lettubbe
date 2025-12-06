import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { Feather } from "@expo/vector-icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import CustomBottomSheet from "@/components/shared/videoUpload/CustomBottomSheet";
import { createReport } from "@/services/report.service";

// Report categories
const REPORT_CATEGORIES = [
  "Sexual Content",
  "Violent or repulsive content",
  "Impersonation",
  "Hateful or abusive content",
  "Harassment or bullying",
  "Harmful or dangerous acts",
  "Child abuse",
  "Promotes terrorism",
  "Spam or misleading",
];

// Sub-categories for specific report types
const REPORT_SUB_CATEGORIES = {
  default: ["Videos", "Comments", "Channel name", "Profile picture", "Description"],
};

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

const ReportModal = ({ isVisible, onClose, userId }: ReportModalProps) => {
  const { theme } = useCustomTheme();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [impersonatedChannel, setImpersonatedChannel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal is opened
  React.useEffect(() => {
    if (isVisible) {
      setStep(1);
      setSelectedCategory("");
      setSelectedSubCategory("");
      setReportDetails("");
      setImpersonatedChannel("");
    }
  }, [isVisible]);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep(2);
  };

  // Handle sub-category selection
  const handleSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setStep(3);
  };

  // Go back to previous step
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedCategory("");
    } else if (step === 3) {
      setStep(2);
      setSelectedSubCategory("");
    }
  };

  // Map category to API format
  const mapCategoryToApiFormat = (category: string): "spam" | "violence" | "harassment" | "hate_speech" | "sexual_content" | "copyright" | "other" => {
    switch (category) {
      case "Sexual Content":
        return "sexual_content";
      case "Violent or repulsive content":
        return "violence";
      case "Harassment or bullying":
        return "harassment";
      case "Hateful or abusive content":
        return "hate_speech";
      case "Spam or misleading":
        return "spam";
      default:
        return "other";
    }
  };

  // Submit report
  const handleSubmitReport = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare report data
      const reportData = {
        postId: userId, // Using userId as the postId in this context
        category: mapCategoryToApiFormat(selectedCategory),
        reason: `${selectedSubCategory ? `${selectedSubCategory} - ` : ""}${reportDetails}${
          selectedCategory === "Impersonation" ? ` - Impersonating: ${impersonatedChannel}` : ""
        }`,
      };
      
      // Submit report
      await createReport(reportData);
      
      // Close modal on success
      onClose();
      // show  success toast
    } catch (error) {
      console.error("Failed to submit report:", error);
      // show a error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step 1 - Category selection
  const renderCategorySelection = () => (
    <ScrollView style={styles.container}>
      <Typography weight="600" size={20} style={styles.title}>
        Report
      </Typography>
      <Typography style={styles.subtitle2} textType="secondary">
        Select a reason for reporting this channel
      </Typography>

      <View style={styles.optionsContainer}>
        {REPORT_CATEGORIES.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              { backgroundColor: Colors[theme].cardBackground }
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Typography>{category}</Typography>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Render step 2 - Subcategory selection
  const renderSubCategorySelection = () => {
    // For impersonation, different UI
    if (selectedCategory === "Impersonation") {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.headerWithBack}>
            <TouchableOpacity onPress={handleBack}>
              <Feather name="chevron-left" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <Typography weight="600" size={20}>
              {selectedCategory}
            </Typography>
          </View>
          
          <Typography style={styles.subtitle} size={16}>
            What channel is being impersonated?
          </Typography>
          <Typography style={[styles.subtitle2, { marginTop: 5 }]} textType="secondary">
            Add the channel handle or link
          </Typography>
          
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }
            ]}
            placeholder="@username or channel link"
            placeholderTextColor={Colors[theme].textLight}
            value={impersonatedChannel}
            onChangeText={setImpersonatedChannel}
          />
          
          <AppButton
            title="Next"
            variant="primary"
            disabled={!impersonatedChannel || (impersonatedChannel.startsWith('@') === false && !impersonatedChannel.includes('/'))}
            handlePress={() => setStep(3)}
            style={styles.submitButton}
          />
        </ScrollView>
      );
    }
    
    // For all other categories
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={handleBack}>
            <Feather name="chevron-left" size={24} color={Colors[theme].text} />
          </TouchableOpacity>
          <Typography weight="600" size={20}>
            {selectedCategory}
          </Typography>
        </View>
        
        <Typography style={styles.subtitle} size={16}>
          What should we review?
        </Typography>
        <Typography style={[styles.subtitle2, { marginTop: 5 }]} textType="secondary">
          Tell us what's breaking the rules
        </Typography>

        <View style={styles.optionsContainer}>
          {REPORT_SUB_CATEGORIES.default.map((subCategory, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                { backgroundColor: Colors[theme].cardBackground }
              ]}
              onPress={() => handleSubCategorySelect(subCategory)}
            >
              <Typography>{subCategory}</Typography>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Render step 3 - Additional details
  const renderAdditionalDetails = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={handleBack}>
            <Feather name="chevron-left" size={24} color={Colors[theme].text} />
          </TouchableOpacity>
          <Typography weight="600" size={20}>
            {selectedCategory}
          </Typography>
        </View>
        
        <Typography style={styles.subtitle} size={16}>
          Tell us more
        </Typography>
        <Typography style={[styles.subtitle, { marginTop: 5, marginBottom: 10 }]} textType="secondary">
          Additional information helps us review your report
        </Typography>
        
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: Colors[theme].cardBackground, color: Colors[theme].text }
          ]}
          placeholder="Provide additional details..."
          placeholderTextColor={Colors[theme].textLight}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={reportDetails}
          onChangeText={setReportDetails}
        />
        
        <AppButton
          title="Submit Report"
          variant="primary"
          disabled={reportDetails.length < 10 || isSubmitting}
          handlePress={handleSubmitReport}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 1:
        return renderCategorySelection();
      case 2:
        return renderSubCategorySelection();
      case 3:
        return renderAdditionalDetails();
      default:
        return renderCategorySelection();
    }
  };

  return (
    <CustomBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      sheetheight={isVisible ? "75%" : 0}
      showClose={true}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 0,
  },
  subtitle2: {
    marginBottom: 20,
  },
  headerWithBack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  textInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  textArea: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    minHeight: 120,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default ReportModal;