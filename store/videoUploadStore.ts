import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Album = {
	id: string;
	title: string;
	assetCount?: number;
	totalAssetCount?: number; // Total photos + videos
};

export type VideoAsset = {
	uri: string;
	fileName?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	duration?: number;
	type?: string;
};

export type MediaDraft = {
	id: string;
	type: 'video' | 'photo';
	uri: string | string[]; // Single URI for video, array for multiple photos
	thumbnailUri: string;
	createdAt: Date;
	duration?: number; // Only applicable for videos
	// User input details
	videoDetails?: VideoDetails;
	postDetails?: PostDetails;
};

// Backward compatibility
export type VideoDraft = MediaDraft;

// Upload progress is now handled by BackgroundUploadService
// Keeping this for backward compatibility but it's deprecated

export type MentionUser = {
	username: string;
};

export type DisplayMentionUser = {
	userId?: string;
	username: string;
	firstName?: string;
	lastName?: string;
	profilePicture?: string;
};

export type VideoDetails = {
	description: string;
	tags: string[];
	visibility: "public" | "private" | "unlisted" | "subscribers";
	isCommentsAllowed: boolean;
	playlistIds: string[];
	thumbnailUri: string;
	mentions: MentionUser[];
};

export type PhotoAsset = {
	uri: string;
	fileName?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	type?: string;
};

export type PostDetails = {
	description: string;
	tags: string[];
	visibility: "public" | "private" | "unlisted" | "subscribers";
	isCommentsAllowed: boolean;
	playlistIds?: string[];
	mentions: MentionUser[];
};

type VideoUploadState = {
	// UI States
	isModalVisible: boolean;
	isFullScreenEditor: boolean;
	isDetailsScreen: boolean;
	isGalleryVisible: boolean;
	isFolderSelectionVisible: boolean;
	dropdownOpen: boolean;

	// Upload mode
	uploadMode: "video" | "photo" | "document" | "audio";

	// Selection state
	selectedVideo: VideoAsset | null;
	selectedPhotos: PhotoAsset[];
	videoDetails: VideoDetails;
	postDetails: PostDetails;
	
	// Temporary selection state for UI flow
	editedVideoUri: string | null;
	drafts: MediaDraft[];
	selectedAlbum: Album | null;
	albums: Album[];

	// Upload state
	isUploading: boolean;
	uploadProgress: number;
	uploadError: string | null;
	isCancelling: boolean;
	abortController: AbortController | null;

	// Chat Upload State
	chatUploadType: "community" | "chat" | null;
	isChatUpload: boolean;
	isUploadingPhotoInChat: boolean;
	isUploadingVideoInChat: boolean;
	isUploadingAudioInChat: boolean;
	isUploadingDocumentInChat: boolean;
	selectedAudios: any[];
	selectedDocuments: any[];

	// Community upload states
	isCommunityUpload: boolean;
	isUploadingPhotoInCommunity: boolean;
	isUploadingVideoInCommunity: boolean;
	isUploadingAudioInCommunity: boolean;
	isUploadingDocumentInCommunity: boolean;

	// Actions
	openUploadModal: () => void;
	closeUploadModal: () => void;
	hideUploadModal: () => void;
	setUploadMode: (mode: "video" | "photo" | "document" | "audio") => void;
	// Selection actions
	setSelectedVideo: (video: VideoAsset | null) => void;
	setSelectedPhotos: (photos: PhotoAsset[]) => void;
	addSelectedPhoto: (photo: PhotoAsset) => void;
	removeSelectedPhoto: (index: number) => void;
	reorderPhotos: (fromIndex: number, toIndex: number) => void;
	clearSelections: () => void;
	openFullScreenEditor: () => void;
	closeFullScreenEditor: () => void;
	openDetailsScreen: () => void;
	closeDetailsScreen: () => void;
	setEditedVideoUri: (uri: string | null) => void;
	// Details setting
	setVideoDetails: (details: Partial<VideoDetails>) => void;
	setPostDetails: (details: Partial<PostDetails>) => void;
	// Upload actions
	setUploading: (isUploading: boolean) => void;
	setUploadProgress: (progress: number) => void;
	setUploadError: (error: string | null) => void;
	setCancelling: (isCancelling: boolean) => void;
	setAbortController: (controller: AbortController | null) => void;
	clearAbortController: () => void;
	resetUpload: () => void;
	fetchDrafts: () => Promise<void>;
	saveDraft: (video: VideoAsset, thumbnailUri?: string) => Promise<void>;
	savePhotoDraft: (photos: PhotoAsset[], thumbnailUri?: string) => Promise<void>;
	deleteDraft: (draftId: string) => Promise<void>;
	currentDraftId: string | null;
	setCurrentDraftId: (draftId: string | null) => void;
	removeCurrentDraft: () => Promise<void>;
	showGallery: () => void;
	hideGallery: () => void;
	showFolderSelection: () => void;
	hideFolderSelection: () => void;
	setSelectedAlbum: (album: Album | null) => void;
	setAlbums: (albums: Album[]) => void;
	setDropdownOpen: (isOpen: boolean) => void;
	shouldNavigateToEditor: boolean;
	navigateToEditor: () => void;
	resetNavigation: () => void;
	setisCommunityUpload: (isCommunityUpload: boolean) => void;
	// setIsUploadingPhotoInCommunity: (isCommunityUpload: boolean) => void;
	// setIsUploadingVideoInCommunity: (isVideoUpload: boolean) => void,
	setChatUploadType: (type: "community" | "chat" | null) => void;
	setIsChatUpload: (isChatUpload: boolean) => void;
	setIsUploadingAudioInChat: (isUploading: boolean) => void;
	setIsUploadingDocumentInChat: (isUploading: boolean) => void;
	setSelectedAudios: (audios: any[]) => void;
	setSelectedDocuments: (documents: any[]) => void;
	reset: () => void;

	// chat Actions
	setIsUploadingPhotoInChat: (isUploading: boolean) => void;
	setIsUploadingVideoInChat: (isUploading: boolean) => void;
	
	// Community upload actions
	setIsCommunityUpload: (isUpload: boolean) => void;
	setIsUploadingPhotoInCommunity: (isUploading: boolean) => void;
	setIsUploadingVideoInCommunity: (isUploading: boolean) => void;
	setIsUploadingAudioInCommunity: (isUploading: boolean) => void;
	setIsUploadingDocumentInCommunity: (isUploading: boolean) => void;
};

const DRAFTS_STORAGE_KEY = "@video_drafts";

const useVideoUploadStore = create<VideoUploadState>((set, get) => ({
	// Initial UI States
	isModalVisible: false,
	isFullScreenEditor: false,
	isDetailsScreen: false,
	isGalleryVisible: false,
	isFolderSelectionVisible: false,
	dropdownOpen: false,

	// Initial upload mode
	uploadMode: "video",

	// Upload state
	isUploading: false,
	uploadProgress: 0,
	uploadError: null,
	isCancelling: false,
	abortController: null,

	// Chat upload states
	isUploadingPhotoInChat: false,
	isUploadingVideoInChat: false,
	isUploadingAudioInChat: false,
	isUploadingDocumentInChat: false,
	selectedAudios: [],
	selectedDocuments: [],
	
	// Community upload states
	isCommunityUpload: false,
	isUploadingPhotoInCommunity: false,
	isUploadingVideoInCommunity: false,
	isUploadingAudioInCommunity: false,
	isUploadingDocumentInCommunity: false,

	chatUploadType: null,
	isChatUpload: false,	

	// Selection data
	selectedVideo: null,
	selectedPhotos: [],
	videoDetails: {
		description: "",
		tags: [],
		visibility: "public",
		isCommentsAllowed: true,
		playlistIds: [],
		thumbnailUri: "",
		mentions: [],
	},
	postDetails: {
		description: "",
		tags: [],
		visibility: "public",
		isCommentsAllowed: true,
		mentions: [],
	},
	editedVideoUri: null,
	drafts: [],
	selectedAlbum: null,
	albums: [],

	shouldNavigateToEditor: false,

	// Actions
	navigateToEditor: () => set({ shouldNavigateToEditor: true }),
	resetNavigation: () => set({ shouldNavigateToEditor: false }),
	openUploadModal: () => set({ 
		isModalVisible: true,
		isGalleryVisible: false,
		isFolderSelectionVisible: false,
		isDetailsScreen: false,
		uploadMode: "video", // Reset to default mode when opening main upload modal
		isCommunityUpload: false, // Reset community upload state
		isChatUpload: false, // Reset chat upload state
		// Clear previous selections and details
		selectedVideo: null,
		selectedPhotos: [],
		editedVideoUri: null,
		videoDetails: {
			description: "",
			tags: [],
			visibility: "public",
			isCommentsAllowed: true,
			playlistIds: [],
			thumbnailUri: "",
			mentions: [],
		},
		postDetails: {
			description: "",
			tags: [],
			visibility: "public",
			isCommentsAllowed: true,
			mentions: [],
		},
		chatUploadType: null, // Reset chat upload type
	}),
	closeUploadModal: () =>
		set({
			isModalVisible: false,
			// Clear UI selections when modal closes
			selectedPhotos: [],
			selectedVideo: null,
		}),
	
	hideUploadModal: () =>
		set({
			isModalVisible: false,
			// Don't clear selections - for navigation to details
		}),

	setUploadMode: (mode) => set({ 
		uploadMode: mode,
		// Clear selections when switching modes
		selectedPhotos: [],
		selectedVideo: null,
	}),
	// UI Selection management - RESTORED for MediaGalleryPicker
	setSelectedVideo: (video) => set({ selectedVideo: video }),
	setSelectedPhotos: (photos) => set({ selectedPhotos: photos }),
	addSelectedPhoto: (photo) => 
		set(state => ({ 
			selectedPhotos: [...state.selectedPhotos, photo].slice(0, 5) // Max 5 photos
		})),
	removeSelectedPhoto: (index) => 
		set(state => ({ 
			selectedPhotos: state.selectedPhotos.filter((_, i) => i !== index)
		})),
	
	reorderPhotos: (fromIndex, toIndex) => 
		set(state => {
			const newPhotos = [...state.selectedPhotos];
			const [movedPhoto] = newPhotos.splice(fromIndex, 1);
			newPhotos.splice(toIndex, 0, movedPhoto);
			return { selectedPhotos: newPhotos };
		}),
	
	clearSelections: () => set({
		selectedPhotos: [],
		selectedVideo: null,
		selectedAudios: [],
		selectedDocuments: [],
	}),

	openFullScreenEditor: () => set({ isFullScreenEditor: true }),
	closeFullScreenEditor: () => {
		set({ 
			isFullScreenEditor: false,
			selectedVideo: null,
			selectedPhotos: [],
			editedVideoUri: null,
			uploadProgress: 0,
			uploadError: null
		});
	},

	openDetailsScreen: () => set({ isDetailsScreen: true }),
	closeDetailsScreen: () => set({ isDetailsScreen: false }),

	showGallery: () => set({ isGalleryVisible: true }),
	hideGallery: () => set({ 
		isGalleryVisible: false,
		// Don't clear selections here as user might want to continue with selected photos
	}),

	showFolderSelection: () => set({ isFolderSelectionVisible: true }),
	hideFolderSelection: () => set({ isFolderSelectionVisible: false }),

	setSelectedAlbum: (album) => set({ selectedAlbum: album }),
	setAlbums: (albums) => set({ albums }),
	setDropdownOpen: (isOpen) => set({ dropdownOpen: isOpen }),

	setEditedVideoUri: (uri) => set({ editedVideoUri: uri }),

	// Details management
	setVideoDetails: (details) =>
		set({
			videoDetails: { ...get().videoDetails, ...details },
		}),
	
	setPostDetails: (details) =>
		set({
			postDetails: { ...get().postDetails, ...details },
		}),

	// Upload actions
	setUploading: (isUploading) => set({ isUploading }),
	setUploadProgress: (progress) => set({ uploadProgress: progress }),
	setUploadError: (error) => set({ uploadError: error }),
	setCancelling: (isCancelling) => set({ isCancelling }),
	setAbortController: (controller) => {
		console.log('🏪 Store: AbortController change', {
			from: get().abortController ? 'exists' : 'null',
			to: controller ? 'new controller' : 'null'
		});
		set({ abortController: controller });
	},
	clearAbortController: () => {
		console.log('🏪 Store: Clearing AbortController');
		set({ abortController: null });
	},

	setisCommunityUpload: (isCommunityUpload) => set({ isCommunityUpload }),

	setChatUploadType: (type) => set({ chatUploadType: type }),

	setIsChatUpload: (isChatUpload) => set({ isChatUpload }),

	setIsUploadingPhotoInChat: (isUploading) => set({ isUploadingPhotoInChat: isUploading }),
	setIsUploadingVideoInChat: (isUploading) => set({ isUploadingVideoInChat: isUploading }),
	setIsUploadingAudioInChat: (isUploading) => set({ isUploadingAudioInChat: isUploading }),
	setIsUploadingDocumentInChat: (isUploading) => set({ isUploadingDocumentInChat: isUploading }),
	setSelectedAudios: (audios) => set({ selectedAudios: audios }),
	setSelectedDocuments: (documents) => set({ selectedDocuments: documents }),

	// setIsUploadingPhotoInCommunity: (isUploadingPhoto) => set({ isUploadingPhotoInCommunity: isUploadingPhoto }),
	// setIsUploadingVideoInCommunity: (val) => set({ isUploadingVideoInCommunity: val }),

	resetUpload: () => {
		set({
			isUploading: false,
			uploadProgress: 0,
			uploadError: null,
			isCancelling: false,
			abortController: null,
			editedVideoUri: null,
			uploadMode: "video",
			isGalleryVisible: false,
			isModalVisible: false,
			selectedAlbum: null,
			selectedVideo: null,
			selectedPhotos: [],
			selectedAudios: [],
			selectedDocuments: [],
			currentDraftId: null,
		});
	},

	fetchDrafts: async () => {
		try {
			const draftsJson = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
			if (draftsJson) {
				const parsedDrafts = JSON.parse(draftsJson);
				// Convert string dates back to Date objects and migrate old drafts
				const drafts = parsedDrafts.map((draft: any) => {
					// Migration: if type is missing, determine type based on URI structure and duration
					let type = draft.type;
					if (!type) {
						// Legacy draft migration logic
						if (Array.isArray(draft.uri)) {
							// Multiple URIs means it's a photo draft
							type = 'photo';
						} else if (draft.duration !== undefined && draft.duration > 0) {
							// Has duration means it's a video draft
							type = 'video';
						} else {
							// Default to video for legacy single URI drafts
							type = 'video';
						}
					}
					
					return {
						...draft,
						type,
						createdAt: new Date(draft.createdAt),
					};
				});
				set({ drafts });
			} else {
				set({ drafts: [] });
			}
		} catch (error) {
			console.error("Error fetching drafts:", error);
			set({ drafts: [] });
		}
	},

	saveDraft: async (video, thumbnailUri) => {
		try {
			const state = get();
			
			// Creating a new draft with user details
			const newDraft: MediaDraft = {
				id: String(Date.now()), // Convert to string first
				type: 'video',
				uri: video.uri,
				thumbnailUri: thumbnailUri || "file://placeholder-thumbnail.jpg",
				createdAt: new Date(),
				duration: video.duration,
				// Save current video details
				videoDetails: { ...state.videoDetails },
			};

			// Get current drafts
			const currentDrafts = [...state.drafts];
			const updatedDrafts = [...currentDrafts, newDraft];

			// Update state
			set({ drafts: updatedDrafts });

			// Save to AsyncStorage
			await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
			console.log('💾 Video draft saved with details:', {
				description: state.videoDetails.description,
				tags: state.videoDetails.tags.length,
				thumbnailUri: newDraft.thumbnailUri
			});
		} catch (error) {
			console.error("Error saving draft:", error);
			throw error;
		}
	},

	savePhotoDraft: async (photos, thumbnailUri) => {
		try {
			const state = get();
			
			// Creating a new photo draft
			const photoUris = photos.map(photo => photo.uri);
			const newDraft: MediaDraft = {
				id: String(Date.now()),
				type: 'photo',
				uri: photoUris, // Array of photo URIs
				thumbnailUri: thumbnailUri || photoUris[0] || "file://placeholder-thumbnail.jpg",
				createdAt: new Date(),
				// No duration for photos
				// Save current post details
				postDetails: { ...state.postDetails },
			};

			// Get current drafts
			const currentDrafts = [...state.drafts];
			const updatedDrafts = [...currentDrafts, newDraft];

			// Update state
			set({ drafts: updatedDrafts });

			// Save to AsyncStorage
			await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
			console.log('💾 Photo draft saved with details:', {
				description: state.postDetails.description,
				tags: state.postDetails.tags?.length || 0,
				photoCount: photoUris.length
			});
		} catch (error) {
			console.error("Error saving photo draft:", error);
			throw error;
		}
	},

	deleteDraft: async (draftId: string) => {
		try {
			const currentDrafts = [...get().drafts];
			const updatedDrafts = currentDrafts.filter((draft) => draft.id !== draftId);

			// Update state
			set({ drafts: updatedDrafts });

			// Save to AsyncStorage
			await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
		} catch (error) {
			console.error("Error deleting draft:", error);
			throw error;
		}
	},

	// Track current draft being uploaded
	currentDraftId: null as string | null,
	setCurrentDraftId: (draftId: string | null) => set({ currentDraftId: draftId }),
	
	// Remove current draft after successful upload
	removeCurrentDraft: async () => {
		try {
			const state = get();
			if (!state.currentDraftId) return;
			
			const currentDrafts = [...state.drafts];
			const updatedDrafts = currentDrafts.filter(draft => draft.id !== state.currentDraftId);
			
			if (updatedDrafts.length !== currentDrafts.length) {
				console.log('🗑️ Removed draft after successful upload:', state.currentDraftId);
				// Update state
				set({ drafts: updatedDrafts, currentDraftId: null });
				
				// Save to AsyncStorage
				await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
			}
		} catch (error) {
			console.error("Error removing current draft:", error);
		}
	},

	// Community upload actions
	setIsCommunityUpload: (isUpload) => set({ isCommunityUpload: isUpload }),
	setIsUploadingPhotoInCommunity: (isUploading) => set({ isUploadingPhotoInCommunity: isUploading }),
	setIsUploadingVideoInCommunity: (isUploading) => set({ isUploadingVideoInCommunity: isUploading }),
	setIsUploadingAudioInCommunity: (isUploading) => set({ isUploadingAudioInCommunity: isUploading }),
	setIsUploadingDocumentInCommunity: (isUploading) => set({ isUploadingDocumentInCommunity: isUploading }),

	reset: () =>
		set({
			// Reset UI States
			isModalVisible: false,
			isFullScreenEditor: false,
			isDetailsScreen: false,
			isGalleryVisible: false,
			isFolderSelectionVisible: false,
			dropdownOpen: false,
			
			// Reset upload mode
			uploadMode: "video",
			
			// Reset community upload states
			isCommunityUpload: false,
			isUploadingPhotoInCommunity: false,
			isUploadingVideoInCommunity: false,
			isUploadingAudioInCommunity: false,
			isUploadingDocumentInCommunity: false,
			
			// Reset remaining data (upload data removed)
			editedVideoUri: null,
			drafts: [],
			selectedAlbum: null,
			albums: [],
			
			// Navigation state
			shouldNavigateToEditor: false,
		}),
}));

export default useVideoUploadStore;
