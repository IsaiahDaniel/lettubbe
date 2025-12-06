// import React from "react";
// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import CustomBottomSheet from "../../ui/CustomBottomSheet";
// import {
//   ImageIcon,
//   FileTextIcon,
//   VideoIcon,
//   MusicIcon,
// } from "lucide-react-native";

// // // import CustomBottomSheet from "./videoUpload/CustomBottomSheet";

// const options = [
//   { label: "Images", type: "image", icon: ImageIcon },
//   { label: "Documents", type: "document", icon: FileTextIcon },
//   { label: "Videos", type: "video", icon: VideoIcon },
//   { label: "Audio", type: "audio", icon: MusicIcon },
// ];

// type FilePickerBottomSheetProps = {
//   visible: boolean;
//   onSelect?: any;
//   type: 'images' | 'videos' | 'documents' | 'audio';
// };

// const FilePickerBottomSheet = ({
//   visible,
//   onSelect,
// }: FilePickerBottomSheetProps) => {
//   return (
//     <CustomBottomSheet isVisible={visible} onClose={onSelect} sheetheight={200}>
//       <View style={styles.sheetContent}>
//         {options.map((item) => {
//           const Icon = item.icon;
//           return (
//             <View key={item.type} style={{ flexDirection: "column", alignItems: "center" }}>
//               <TouchableOpacity
//                 // key={item.type}
//                 style={styles.option}
//                 onPress={() => onSelect?.(item.type)}
//                 activeOpacity={0.8}
//               >
//                 <Icon size={24} color="#000" />
//               </TouchableOpacity>
//               <Text style={styles.optionText}>{item.label}</Text>
//             </View>
//           );
//         })}
//       </View>
//     </CustomBottomSheet>
//   );
// };

// const styles = StyleSheet.create({
//   sheetContent: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center"
//   },
//   option: {
//     alignItems: "center",
//     justifyContent: "center",
//     // gap: 6,
//     backgroundColor: "#F8F8FF",
//     padding: 8,
//     borderRadius: 9999,
//     width: 70,
//     height: 70,
//   },
//   optionText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#333",
//     marginTop: 4,
//   },
// });

// export default FilePickerBottomSheet;

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
// import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import {
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
  XIcon,
  Play,
} from "lucide-react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import useAlbum from "@/hooks/upload/useAlbum";
import { Feather } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import useAlbumViews from "@/hooks/upload/useAlbumViews";
import CustomBottomSheet from "../../videoUpload/CustomBottomSheet";
import useUploadVideo from "@/hooks/upload/useUploadVideo";
import useVideoUploadStore from "@/store/videoUploadStore";

const options = [
  { label: "Images", type: "photo", icon: ImageIcon },
  { label: "Videos", type: "video", icon: Play },
  { label: "Audio", type: "audio", icon: MusicIcon },
  { label: "Documents", type: "document", icon: FileTextIcon },
];

type FilePickerBottomSheetProps = {
  visible: boolean;
  onSelect?: (type?: string) => void;
  selectedType: "photo" | "video" | "document" | "audio" | null;
  chatFunctions?: {
    setUploadedImageUrls?: (urls: string[]) => void;
    setUploadedVideoUrls?: (urls: string[]) => void;
    setChatMessage?: (message: string) => void;
    handleSendChat?: () => void;
    sendMediaMessage?: (caption: string, mediaAssets: any[]) => void;
    closeModal?: () => void;
  };
};

const FilePickerBottomSheet = ({
  visible,
  onSelect,
  selectedType,
  chatFunctions,
}: FilePickerBottomSheetProps) => {
  const { theme } = useCustomTheme();
  const { setSelectedAlbum } = useVideoUploadStore();
  const {
    albumSelectorRef,
    handleAlbumSelectorPress,
    isFolderSelectionVisible,
    selectedAlbum,
    setUploadMode,
    setisCommunityUpload,
    fetchAlbums
  } = useAlbum(selectedType as string);
  const { renderContent } = useAlbumViews(selectedType, chatFunctions);

  // Handle album setup when picker becomes visible
  useEffect(() => {
    console.log("🎯 [FILE_PICKER] Setup effect:", { visible, selectedType });
    
    if (visible && selectedType) {
      // Clear selected album when switching media types (except documents)
      if (selectedType !== 'document') {
        setSelectedAlbum(null);
      }
      
      // Fetch albums for images/videos (audio/documents don't need albums)
      if (selectedType !== 'document') {
        console.log("🎯 [FILE_PICKER] Calling fetchAlbums for type:", selectedType);
        fetchAlbums();
      }
    }
  }, [visible, selectedType, fetchAlbums, setSelectedAlbum]);

  // console.log("visible", visible);

  const renderMainOptions = () => (
    <View style={styles.sheetContent}>
      {options.map((item) => {
        const Icon = item.icon;
        return (
          <View
            key={item.type}
            style={{ flexDirection: "column", alignItems: "center" }}
          >
            <TouchableOpacity
              style={[styles.option, { backgroundColor: Colors[theme].cardBackground }]}
              onPress={() => {
                onSelect?.(item.type);
                setUploadMode(item.type as any);
              }}
              activeOpacity={0.8}
            >
              <Icon size={28} color={Colors[theme].text} />
            </TouchableOpacity>
            <Text style={{ ...styles.optionText, color: Colors[theme].text }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderFileList = () => {
    if (!selectedType) return null;

    return (
      <View style={styles.fileListContainer}>
        {!isFolderSelectionVisible && selectedType !== 'audio' && selectedAlbum && (
          <View style={styles.centerTitleContainer}>
            <TouchableOpacity
              ref={albumSelectorRef}
              style={styles.albumSelector}
              onPress={handleAlbumSelectorPress}
            >
              <View>
                <Feather
                  name="chevron-left"
                  size={24}
                  color={Colors[theme].textBold}
                />
              </View>
              <Typography weight="600" size={16} textType="textBold">
                {String(selectedAlbum?.title || "Unknown Album")}
              </Typography>

            </TouchableOpacity>
          </View>
        )}
        {selectedType === 'audio' && (
          <View style={styles.centerTitleContainer}>
            <View style={styles.albumSelector}>
              <Typography weight="600" size={16} textType="textBold">
                Audio Files
              </Typography>
            </View>
          </View>
        )}

        {renderContent()}
      </View>
    );
  };

  return (
    <CustomBottomSheet
      isVisible={visible}
      onClose={() => {
        // setSelectedPickerType(null);
        onSelect?.();
        setisCommunityUpload(false);
      }}
      sheetheight={selectedType === 'document' ? 280 : selectedType ? 700 : 180}
    >
      {selectedType ? renderFileList() : renderMainOptions()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // paddingHorizontal: 16,
  },
  albumSelector: {
    flexDirection: "row",
    // alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 6,
    gap: 8,
  },
  centerTitleContainer: {
  },
  optionContainer: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  option: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 9999,
    width: 60,
    height: 60,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  fileListContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  fileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});

export default FilePickerBottomSheet;
