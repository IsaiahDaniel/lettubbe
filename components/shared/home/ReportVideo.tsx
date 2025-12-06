import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator, Image } from "react-native";
import Icon from "react-native-remix-icon";
import { useForm, Controller } from "react-hook-form";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { createReport } from "@/services/report.service";
import Input from "@/components/ui/inputs/Input";
import AppButton from "@/components/ui/AppButton";

const REPORT_CATEGORIES = [
  { id: "spam", label: "Spam or misleading" },
  { id: "violence", label: "Violent or repulsive content" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate_speech", label: "Hateful or abusive content" },
  { id: "sexual_content", label: "Sexual content" },
  { id: "copyright", label: "Copyright infringement" },
  { id: "other", label: "Other" }
];

interface ReportVideoProps {
  videoId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  category: string;
  reason: string;
}

const ReportVideo: React.FC<ReportVideoProps> = ({ videoId, onClose, onSuccess }) => {
  const { theme } = useCustomTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      category: "",
      reason: ""
    }
  });
  
  const watchReason = watch("reason");

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setError(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!selectedCategory) {
      setError("Please select a reason for reporting");
      return false;
    }

    if (selectedCategory === "other" && (!watchReason || watchReason.trim().length < 10)) {
      setError("Please provide more details about your report");
      return false;
    }

    return true;
  }, [selectedCategory, watchReason]);

  const onSubmit = useCallback(async (data: FormValues) => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      const reportData = {
        postId: videoId,
        category: selectedCategory as "spam" | "violence" | "harassment" | "hate_speech" | "sexual_content" | "copyright" | "other",
        reason: data.reason.trim() || `Reported for ${selectedCategory}`
      };
      
      await createReport(reportData);
      
      Alert.alert(
        "Report Submitted",
        "Thank you for your report. We'll review it and take appropriate action.",
        [{ text: "OK", onPress: onClose }]
      );
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        "Error",
        "Something went wrong while submitting your report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [videoId, selectedCategory, onClose, onSuccess, validateForm]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography textType="textBold" weight="600" style={styles.title}>
          Report Content
        </Typography>
        <Typography textType="text" style={styles.subtitle}>
          Please select a reason for reporting this content
        </Typography>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {REPORT_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <View
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    selectedCategory === category.id
                      ? Colors[theme].cardBackground
                      : Colors[theme].cardBackground,
                  borderColor:
                    selectedCategory === category.id
                      ? Colors.general.error
                      : Colors[theme].cardBackground,
                },
              ]}
            >
              <View 
                style={styles.categoryContent}
                onTouchEnd={() => handleCategorySelect(category.id)}
              >
                <Typography textType="textBold" weight="500">
                  {category.label}
                </Typography>
                {selectedCategory === category.id && (
                  <Icon
                    name="checkbox-circle-fill"
                    size={24}
                    color={Colors.general.error}
                  />
                )}
              </View>
            </View>
          </View>
        ))}

        {selectedCategory === "other" && (
          <View style={styles.reasonContainer}>
            <Typography textType="text" weight="500" style={styles.reasonLabel}>
              Please provide more details:
            </Typography>
            <Controller
              name="reason"
              control={control}
              rules={{ 
                minLength: { 
                  value: 10, 
                  message: "Please provide at least 10 characters" 
                } 
              }}
              render={({ field }) => (
                <Input
                  name="reason"
                  control={control}
                  placeholder="Tell us more about the issue..."
                  multiline={true}
                  numberOfLines={4}
                  style={styles.reasonInput}
                />
              )}
            />
          </View>
        )}

        {error && (
          <Typography textType="text" style={styles.errorText}>
            {error}
          </Typography>
        )}

        <View style={styles.buttonsContainer}>
          <AppButton
            title="Submit Report"
            // variant="profile"
            handlePress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />
          {/* <AppButton
            title="Cancel"
            variant="secondary" 
            handlePress={onClose}
            style={styles.cancelButton}
          /> */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  reasonContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  reasonLabel: {
    marginBottom: 8,
  },
  reasonInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#F5222D",
    marginBottom: 16,
  },
  buttonsContainer: {
    marginTop: 24,
    // marginBottom: 16,
  },
  submitButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 24,
  },
});

export default ReportVideo;