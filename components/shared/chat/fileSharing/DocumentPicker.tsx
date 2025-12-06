import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import useVideoUploadStore from '@/store/videoUploadStore';

// Allowed document types for security
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface DocumentPickerProps {
  onDocumentsSelected?: (documents: any[]) => void;
  onClose?: () => void;
  chatFunctions?: {
    sendMediaMessage?: (caption: string, mediaAssets: any[]) => void;
    closeModal?: () => void;
  };
}

const DocumentPickerComponent: React.FC<DocumentPickerProps> = ({
  onDocumentsSelected,
  onClose,
  chatFunctions
}) => {
  const { theme } = useCustomTheme();
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpenedPicker, setHasOpenedPicker] = useState(false);
  
  const { setSelectedDocuments: setStoreDocuments } = useVideoUploadStore();

  // Automatically open document picker when component mounts
  useEffect(() => {
    const openDocumentPicker = async () => {
      if (hasOpenedPicker) return;
      
      setHasOpenedPicker(true);
      setIsLoading(true);

      try {
        console.log("📄 [DOCUMENT_PICKER] Auto-opening document picker");

        const result = await DocumentPicker.getDocumentAsync({
          type: ALLOWED_DOCUMENT_TYPES,
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          const validDocuments: any[] = [];
          
          for (const asset of result.assets) {
            if (validateDocument(asset)) {
              const documentData = {
                uri: asset.uri,
                name: asset.name,
                filename: asset.name,
                size: asset.size,
                type: asset.mimeType,
                mimeType: asset.mimeType,
                mediaType: 'document',
              };
              
              validDocuments.push(documentData);
            }
          }

          if (validDocuments.length > 0) {
            setSelectedDocuments(validDocuments);
            onDocumentsSelected?.(validDocuments);
          } else if (validDocuments.length === 0) {
            onClose?.();
          }
        } else {
          // User cancelled, close modal
          onClose?.();
        }
      } catch (error) {
        console.error("❌ [DOCUMENT_PICKER] Auto-open error:", error);
        onClose?.();
      } finally {
        setIsLoading(false);
      }
    };
    
    openDocumentPicker();
  }, []); // Only run once on mount

  const validateDocument = (document: any): boolean => {
    console.log("🔒 [DOCUMENT_PICKER] Validating document:", {
      name: document.name,
      type: document.mimeType,
      size: document.size
    });

    // Check file size
    if (document.size && document.size > MAX_FILE_SIZE) {
      Alert.alert(
        'File Too Large',
        `File "${document.name}" is too large. Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      );
      return false;
    }

    // Check MIME type
    if (document.mimeType && !ALLOWED_DOCUMENT_TYPES.includes(document.mimeType)) {
      Alert.alert(
        'File Type Not Allowed',
        `File type "${document.mimeType}" is not supported for security reasons.`
      );
      return false;
    }

    // Check file extension as additional security
    const fileName = document.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'json'];
    
    if (extension && !allowedExtensions.includes(extension)) {
      Alert.alert(
        'File Extension Not Allowed',
        `File extension ".${extension}" is not supported for security reasons.`
      );
      return false;
    }

    console.log("✅ [DOCUMENT_PICKER] Document validation passed");
    return true;
  };

  const handlePickDocuments = async () => {
    try {
      setIsLoading(true);
      console.log("📄 [DOCUMENT_PICKER] Opening document picker");

      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_DOCUMENT_TYPES,
        copyToCacheDirectory: true,
        multiple: true, // Allow multiple document selection
      });

      console.log("📄 [DOCUMENT_PICKER] Document picker result:", result);

      if (!result.canceled && result.assets) {
        const validDocuments: any[] = [];
        
        for (const asset of result.assets) {
          if (validateDocument(asset)) {
            const documentData = {
              uri: asset.uri,
              name: asset.name,
              filename: asset.name,
              size: asset.size,
              type: asset.mimeType,
              mimeType: asset.mimeType,
              mediaType: 'document', // Mark as document for optimistic message system
            };
            
            validDocuments.push(documentData);
            console.log("✅ [DOCUMENT_PICKER] Added valid document:", documentData.name);
          }
        }

        if (validDocuments.length > 0) {
          setSelectedDocuments(validDocuments);
          onDocumentsSelected?.(validDocuments);
          
          console.log("📄 [DOCUMENT_PICKER] Selected documents:", validDocuments.length);
        } else {
          console.log("⚠️ [DOCUMENT_PICKER] No valid documents selected");
          // If no valid documents and this was the initial auto-open, close the modal
          if (hasOpenedPicker && selectedDocuments.length === 0) {
            onClose?.();
          }
        }
      } else {
        console.log("📄 [DOCUMENT_PICKER] Document selection cancelled");
        // If user cancelled and no documents selected, close the modal
        if (selectedDocuments.length === 0) {
          onClose?.();
        }
      }
    } catch (error) {
      console.error("❌ [DOCUMENT_PICKER] Error picking documents:", error);
      Alert.alert(
        'Error',
        'Failed to pick documents. Please try again.'
      );
      // If error occurred and no documents selected, close the modal
      if (selectedDocuments.length === 0) {
        onClose?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDocuments = () => {
    console.log("🔵 [DOCUMENT_PICKER] Send button clicked!");
    console.log("📄 [DOCUMENT_PICKER] Selected documents:", selectedDocuments);
    
    if (selectedDocuments.length === 0) {
      console.log("❌ [DOCUMENT_PICKER] No documents selected");
      Alert.alert('No Documents', 'Please select documents first.');
      return;
    }

    console.log("📤 [DOCUMENT_PICKER] Sending documents:", selectedDocuments.length);
    console.log("📄 [DOCUMENT_PICKER] Chat functions available:", {
      hasSendMediaMessage: !!chatFunctions?.sendMediaMessage,
      hasCloseModal: !!chatFunctions?.closeModal,
      chatFunctions: chatFunctions
    });
    
    if (chatFunctions?.sendMediaMessage) {
      console.log("📤 [DOCUMENT_PICKER] Calling sendMediaMessage with documents:", selectedDocuments);
      chatFunctions.sendMediaMessage('', selectedDocuments);
      console.log("📤 [DOCUMENT_PICKER] sendMediaMessage called, now closing modal");
      chatFunctions.closeModal?.();
    } else {
      console.log("⚠️ [DOCUMENT_PICKER] No sendMediaMessage function, using fallback");
      // Fallback: Set in store for upload processing
      setStoreDocuments(selectedDocuments);
    }
    
    console.log("✅ [DOCUMENT_PICKER] handleSendDocuments completed");
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = selectedDocuments.filter((_, i) => i !== index);
    setSelectedDocuments(updatedDocuments);
    onDocumentsSelected?.(updatedDocuments);
  };


  return (
    <View style={[styles.container]}>

      {/* Loading State */}
      {isLoading && selectedDocuments.length === 0 && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[theme].textLight }]}>
            Opening document picker...
          </Text>
        </View>
      )}

      {/* No Documents Selected State */}
      {!isLoading && selectedDocuments.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={Colors[theme].textLight} />
          <Text style={[styles.emptyTitle, { color: Colors[theme].text }]}>
            No documents selected
          </Text>
        </View>
      )}

      {/* Selected Document */}
      {selectedDocuments.length > 0 && (
        <View style={styles.selectedDocument}>
          <View style={styles.documentContainer}>
            <View style={[styles.documentItem, { backgroundColor: Colors[theme].cardBackground }]}>
              <Feather
                name="file-text"
                size={48}
                color={Colors[theme].text}
              />
              <TouchableOpacity
                onPress={() => removeDocument(0)}
                style={styles.removeButton}
              >
                <Feather name="x" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: Colors.general.primary }]}
              onPress={handleSendDocuments}
            >
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Button - Only show if no documents selected */}
      {selectedDocuments.length === 0 && !isLoading && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.pickButton, { backgroundColor: Colors[theme].cardBackground }]}
            onPress={handlePickDocuments}
            disabled={isLoading}
          >
            <Feather name="folder" size={20} color={Colors[theme].text} />
            <Text style={[styles.buttonText, { color: Colors[theme].text }]}>
              Pick Documents
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  selectedDocument: {
    height: 160,
    justifyContent: 'flex-end',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentItem: {
    width: 150,
    height: 150,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  pickButton: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DocumentPickerComponent;