import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import useVideoUploadStore from "@/store/videoUploadStore";
import { getPresignedUrl } from "@/services/aws.service";
import { uploadFile } from "@/helpers/utils/upload-utils";
import { handleError } from "@/helpers/utils/handleError";
import { getData, storeData } from "@/helpers/utils/storage";
import useAuth from "../auth/useAuth";

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

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
  'txt', 'csv', 'zip', 'json'
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const useUploadDocumentInChat = (
  togglePicker: any, 
  parentSetUploadedDocumentUrls?: (urls: string[]) => void,
  parentSetUploadedDocumentDetails?: (details: Array<{url: string; name: string; size: number; type: string}>) => void
) => {
  const {
    isChatUpload,
    isUploadingDocumentInChat,
    selectedDocuments,
    setIsChatUpload,
    setIsUploadingDocumentInChat,
    setSelectedDocuments,
    clearSelections,
  } = useVideoUploadStore();

  const { userDetails } = useAuth();

  const [uploadedDocumentUrls, setUploadedDocumentUrls] = useState<string[]>([]);
  const [uploadedDocumentDetails, setUploadedDocumentDetails] = useState<Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>>([]);
  const hasTriggeredUploadRef = useRef(false);

  const validateDocument = (document: any): boolean => {
    console.log("🔒 [DOCUMENT SECURITY] Validating document:", {
      name: document.name || document.filename,
      type: document.type || document.mimeType,
      size: document.size
    });

    // Check file size
    if (document.size && document.size > MAX_FILE_SIZE) {
      throw new Error(`File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    const mimeType = document.type || document.mimeType;
    if (mimeType && !ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      throw new Error(`File type not allowed: ${mimeType}`);
    }

    // Check file extension
    const fileName = document.name || document.filename || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`File extension not allowed: ${extension}`);
    }

    // Additional security: Check for double extensions (e.g., file.pdf.exe)
    const extensionCount = fileName.split('.').length - 1;
    if (extensionCount > 1) {
      console.warn("🔒 [DOCUMENT SECURITY] Multiple extensions detected:", fileName);
    }

    console.log("✅ [DOCUMENT SECURITY] Document validation passed");
    return true;
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove potentially dangerous characters and normalize
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .substring(0, 255); // Limit length
  };

  const { mutate, isPending, isError, error, isSuccess } = useMutation({
    mutationKey: ["uploadDocumentToChat"],
    mutationFn: async () => {
      console.log("🔄 [DOCUMENT UPLOAD] Starting document upload process");
      console.log("📄 [DOCUMENT UPLOAD] Selected documents:", selectedDocuments?.length || 0);

      if (!selectedDocuments || selectedDocuments.length === 0) {
        throw new Error("No document files selected");
      }

      const uploadResults = [];

      // Upload each document (support multiple documents)
      for (let i = 0; i < selectedDocuments.length; i++) {
        const document = selectedDocuments[i];
        console.log(`📄 [DOCUMENT UPLOAD] Processing document ${i + 1}:`, document);
        
        // Validate document for security
        validateDocument(document);
        
        const sanitizedFileName = sanitizeFileName(document.name || document.filename || `document_${Date.now()}`);
        
        const documentDetails = {
          uri: document.uri,
          name: sanitizedFileName,
          type: document.type || document.mimeType || 'application/octet-stream',
          size: document.size || 0
        };
        
        console.log("📄 [DOCUMENT UPLOAD] Document details:", documentDetails);

        console.log("🔗 [DOCUMENT UPLOAD] Getting presigned URL...");
        const signedResponse = await getPresignedUrl();
        const signedUrl = signedResponse?.data;

        console.log("🔗 [DOCUMENT UPLOAD] Signed URL:", signedUrl);

        if (!signedUrl || typeof signedUrl !== "string") {
          console.error("❌ [DOCUMENT UPLOAD] Invalid signed URL");
          throw new Error("Invalid signed URL");
        }

        console.log(`⬆️ [DOCUMENT UPLOAD] Uploading document ${i + 1}...`);
        const uploadedUrl = await uploadFile(documentDetails, signedUrl);

        if (typeof uploadedUrl !== "string") {
          console.error("❌ [DOCUMENT UPLOAD] Upload failed");
          throw new Error("Document upload failed");
        }

        const cleanedUrl = uploadedUrl.split("?")[0];
        console.log(`✅ [DOCUMENT UPLOAD] Document ${i + 1} upload successful:`, cleanedUrl);
        
        uploadResults.push({
          url: cleanedUrl,
          name: sanitizedFileName,
          size: documentDetails.size,
          type: documentDetails.type
        });
      }

      return uploadResults;
    },
    onSuccess: (results) => {
      console.log("✅ [DOCUMENT UPLOAD] All uploads successful:", results);
      
      const urls = results.map(r => r.url);
      setUploadedDocumentUrls(urls);
      setUploadedDocumentDetails(results);
      
      // Call parent state setters if provided
      if (parentSetUploadedDocumentUrls) {
        console.log("📤 [DOCUMENT UPLOAD] Calling parent state setter with URLs:", urls);
        parentSetUploadedDocumentUrls(urls);
      }
      if (parentSetUploadedDocumentDetails) {
        console.log("📤 [DOCUMENT UPLOAD] Calling parent state setter with details:", results);
        parentSetUploadedDocumentDetails(results);
      }
      
      console.log("📝 [DOCUMENT UPLOAD] Set uploaded document URLs:", urls);
      setIsUploadingDocumentInChat(false);
      setIsChatUpload(false);
      clearSelections();
      console.log("🏁 [DOCUMENT UPLOAD] Upload process completed");
    },
    onError: (err) => {
      console.error("❌ [DOCUMENT UPLOAD] Upload error:", err);
      setIsChatUpload(false);
      setIsUploadingDocumentInChat(false);
      handleError(err);
    },
  });

  // Automatically trigger upload when flag is true
  useEffect(() => {
    // Early return if no upload activity - prevents running on every render
    if (!isUploadingDocumentInChat || !selectedDocuments || selectedDocuments.length === 0 || isPending || hasTriggeredUploadRef.current) {
      return;
    }
    
    console.log("🔄 [DOCUMENT UPLOAD] Upload effect triggered:", { 
      isUploadingDocumentInChat, 
      selectedDocumentsCount: selectedDocuments?.length || 0,
      selectedDocuments: selectedDocuments,
      isPending,
      hasTriggered: hasTriggeredUploadRef.current
    });
    
    console.log("🚀 [DOCUMENT UPLOAD] Starting document upload process...");
    console.log("📄 [DOCUMENT UPLOAD] Documents to upload:", selectedDocuments);
    hasTriggeredUploadRef.current = true;
    mutate();
  }, [isUploadingDocumentInChat, selectedDocuments?.length, isPending, mutate]);

  // Reset trigger when upload completes or fails
  useEffect(() => {
    if (!isUploadingDocumentInChat && hasTriggeredUploadRef.current) {
      console.log("🔄 [DOCUMENT UPLOAD] Resetting upload trigger");
      hasTriggeredUploadRef.current = false;
    }
  }, [isUploadingDocumentInChat]);

  const removeUploadedUrl = async (url: string, chatId: string) => {
    console.log("removing document url from chat", chatId);

    const updatedUrls = uploadedDocumentUrls.filter(u => u !== url);
    const updatedDetails = uploadedDocumentDetails.filter(d => d.url !== url);
    
    setUploadedDocumentUrls(updatedUrls);
    setUploadedDocumentDetails(updatedDetails);

    // Save to local storage for cleanup tracking
    const removedKey = `${chatId}/${userDetails._id}/@chat_removed_document_uploads`;
    try {
      const removed: string[] = (await getData<string[]>(removedKey)) || [];
      await storeData(removedKey, [...removed, url]);
    } catch (e) {
      console.error("Failed to save removed document:", e);
    }
  };

  return {
    uploadedDocumentUrls,
    uploadedDocumentDetails,
    setUploadedDocumentUrls,
    setUploadedDocumentDetails,
    isUploading: isPending,
    isUploadError: isError,
    uploadError: error,
    isUploadSuccess: isSuccess,
    isChatUpload,
    startUpload: () => {
      setIsUploadingDocumentInChat(true);
    },
    removeUploadedUrl,
  };
};

export default useUploadDocumentInChat;