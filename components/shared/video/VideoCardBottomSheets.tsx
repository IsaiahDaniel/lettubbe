import { View, StyleSheet } from "react-native";
import React, { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import CommentSection from "../home/CommentSection";
import { ExternalLink } from "@/components/ExternalLink";
import ShareVideoModal from "./ShareVideoModal";
import { Colors } from "@/constants";
import { VideoCardBottomSheetsProps } from "@/helpers/types/feed/types";

const styles = StyleSheet.create({
	rowContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
});

const CommentsSheetContent = memo(({ postId, authorId }: { postId: string, authorId: string }) => (
  <CommentSection postId={postId} authorId={authorId} />
));

const PlaysSheetContent = memo(({ textColor }: { textColor: string }) => (
	<View style={{ gap: 21 }}>
		<View style={styles.rowContainer}>
			<Ionicons name="play-outline" size={24} color={textColor} />
			<Typography weight="700" size={20} lineHeight={24} color={textColor}>
				Views
			</Typography>
		</View>
		<Typography textType="textBold">
			Times this post has been viewed.
			{/* <ExternalLink href="#">
				<Typography weight="600" color={Colors.general.blue}>
					Help Center
				</Typography>
			</ExternalLink> */}
			.
		</Typography>
	</View>
));

interface ExtendedVideoCardBottomSheetsProps extends VideoCardBottomSheetsProps {
  authorId: string;
  isCommentsAllowed?: boolean;
  videoData?: {
    _id: string;
    thumbnail?: string;
    images?: string[]; // For photo posts
    duration?: string;
    description: string;
    user: {
      _id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
    } | null;
  };
}

// Combined bottom sheets component with added authorId prop
export const VideoCardBottomSheets = memo(
  ({ activeSheet, onClose, postId, textColor, authorId, videoData, isCommentsAllowed = true }: ExtendedVideoCardBottomSheetsProps) => {
    
    if (!activeSheet) return null;

    return (
        <>
            {activeSheet === "comments" && isCommentsAllowed && (
                <CustomBottomSheet isVisible={true} onClose={onClose} showCloseIcon={false} sheetheight={700}>
                    <CommentsSheetContent postId={postId} authorId={authorId} />
                </CustomBottomSheet>
            )}

            {activeSheet === "plays" && (
                <CustomBottomSheet isVisible={true} onClose={onClose}>
                    <PlaysSheetContent textColor={textColor} />
                </CustomBottomSheet>
            )}

            {activeSheet === "share" && videoData && videoData.user && videoData.user._id && (
                <ShareVideoModal 
                  isVisible={true} 
                  onClose={onClose}
                  videoData={videoData as typeof videoData & { user: NonNullable<typeof videoData.user> }}
                />
            )}
        </>
    );
});