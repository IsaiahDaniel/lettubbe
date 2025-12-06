import React, { useState, useRef, useEffect, memo } from "react";
import { View, Image, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { devLog } from "@/config/dev";

interface AvatarProps {
  imageSource?: string | { uri: string } | number;
  uri?: boolean;
  alt?: string;
  size?: number;
  ringColor?: string;
  ringThickness?: number;
  gapSize?: number;
  style?: any;
  fallback?: string;
  showRing?: boolean;
  expandable?: boolean;
  expandedSize?: number;
  showTextFallback?: boolean;
  fallbackText?: string; // Custom text to show instead of first letter
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define default style outside component to prevent recreation on every render
const DEFAULT_STYLE = {};

const Avatar: React.FC<AvatarProps> = ({
  uri,
  imageSource = null,
  alt = "",
  size = 40,
  ringColor = "#F2F2F7",
  ringThickness = 2,
  gapSize = 1.8,
  style = DEFAULT_STYLE,
  fallback,
  showRing = true,
  expandable = false,
  expandedSize = Math.min(screenWidth * 0.8, screenHeight * 0.6),
  showTextFallback = false,
  fallbackText,
}) => {
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoadState, setImageLoadState] = useState('loading'); // 'loading', 'success', 'error'

  // Track render count and prop changes
  const renderCount = useRef(0);
  const prevProps = useRef({
    imageSource,
    uri,
    alt,
    size,
    ringColor,
    ringThickness,
    gapSize,
    style,
    fallback,
    showRing,
    expandable,
    expandedSize,
    showTextFallback,
    fallbackText
  });

  useEffect(() => {
    renderCount.current += 1;

    // Check which props changed
    const currentProps = {
      imageSource,
      uri,
      alt,
      size,
      ringColor,
      ringThickness,
      gapSize,
      style,
      fallback,
      showRing,
      expandable,
      expandedSize,
      showTextFallback,
      fallbackText
    };

    const changedProps: string[] = [];
    Object.keys(currentProps).forEach(key => {
      const oldValue = prevProps.current[key as keyof typeof currentProps];
      const newValue = currentProps[key as keyof typeof currentProps];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        if (key === 'style') {
          changedProps.push(`${key}: ${typeof oldValue === 'object' ? 'object' : oldValue} → ${typeof newValue === 'object' ? 'object' : newValue}`);
        } else {
          changedProps.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
        }
      }
    });

    // For "NO PROPS CHANGED" cases, also check if it's the same instance
    if (changedProps.length === 0 && renderCount.current > 1) {
      const sameInstances: string[] = [];
      Object.keys(currentProps).forEach(key => {
        const isSameInstance = prevProps.current[key as keyof typeof currentProps] === currentProps[key as keyof typeof currentProps];
        if (!isSameInstance && typeof currentProps[key as keyof typeof currentProps] === 'object') {
          sameInstances.push(`${key}: different object instance`);
        }
      });

      if (sameInstances.length > 0) {
        devLog('GENERAL', `Avatar render #${renderCount.current} for ${alt || 'unnamed user'} - Same values but different instances: ${sameInstances.join(', ')}`);
      }
    }

    if (renderCount.current === 1) {
      devLog('GENERAL', `Avatar initial render for ${alt || 'unnamed user'}`);
    } else if (changedProps.length > 0) {
      devLog('GENERAL', `Avatar render #${renderCount.current} for ${alt || 'unnamed user'} - Props changed: ${changedProps.join(', ')}`);
    } else {
      devLog('GENERAL', `Avatar render #${renderCount.current} for ${alt || 'unnamed user'} - NO PROPS CHANGED (unnecessary re-render!)`);
    }

    prevProps.current = currentProps;
  });

  // Reset image state when imageSource changes
  useEffect(() => {
    if (imageSource) {
      setError(false);
      setImageLoadState('loading');
      devLog('GENERAL', `Avatar imageSource changed for ${alt || 'unnamed user'} - new source: ${typeof imageSource === 'string' ? imageSource : JSON.stringify(imageSource)}`);
    } else {
      devLog('GENERAL', `Avatar imageSource is empty for ${alt || 'unnamed user'} - will show fallback`);
    }
  }, [imageSource, alt]);

  // Calculate dimensions
  const outerSize = size;
  const innerSize = size - ringThickness * 2 - gapSize * 2;

  // Check if we should show text fallback
  const shouldShowTextFallback = showTextFallback && (error || !imageSource || (typeof imageSource === 'string' && imageSource.trim() === ''));

  // Get the fallback text (first letter of alt or custom fallbackText)
  const getFallbackText = () => {
    if (fallbackText) return fallbackText.substring(0, 2).toUpperCase();
    if (alt) return alt.substring(0, 1).toUpperCase();
    return '?';
  };

  // Format imageSource correctly based on its type and the uri flag
  const getFormattedSource = () => {
    // If there was an error loading or no source, use fallback
    if (error || !imageSource || (typeof imageSource === 'string' && imageSource.trim() === '')) {
      devLog('GENERAL', `Avatar using fallback image for ${alt || 'unnamed user'} - Reason: ${error ? 'error' : !imageSource ? 'no imageSource' : 'empty string'}`);
      return require("../../assets/images/avatar.png");
    }

    // If imageSource is already a number (require statement result), use it directly
    if (typeof imageSource === 'number') {
      devLog('GENERAL', `Avatar using number source for ${alt || 'unnamed user'}`);
      return imageSource;
    }

    // If uri flag is true, ensure we have proper uri format
    if (uri) {
      // If imageSource is already a uri object, use it
      if (typeof imageSource === 'object' && imageSource.uri) {
        // Validate S3 URL - reject invalid bucket names
        if (imageSource.uri?.includes('lwsrh.s3') || imageSource.uri?.includes('invalid-bucket')) {
          devLog('GENERAL', `Avatar rejecting invalid S3 URL in object for ${alt || 'unnamed user'} - URI: ${imageSource.uri}`);
          setError(true);
          return require("../../assets/images/avatar.png");
        }
        devLog('GENERAL', `Avatar using uri object for ${alt || 'unnamed user'} - URI: ${imageSource.uri}`);
        return imageSource;
      }
      // If imageSource is a string, convert to uri object
      if (typeof imageSource === 'string') {
        // Validate S3 URL - reject invalid bucket names
        if (imageSource.includes('lwsrh.s3') || imageSource.includes('invalid-bucket')) {
          devLog('GENERAL', `Avatar rejecting invalid S3 URL for ${alt || 'unnamed user'} - URI: ${imageSource}`);
          setError(true);
          return require("../../assets/images/avatar.png");
        }
        devLog('GENERAL', `Avatar converting string to uri for ${alt || 'unnamed user'} - URI: ${imageSource}`);
        return { uri: imageSource };
      }
    }

    // If imageSource doesn't match expected formats, use fallback
    devLog('GENERAL', `Avatar using fallback - unexpected format for ${alt || 'unnamed user'} - imageSource: ${JSON.stringify(imageSource)}, uri flag: ${uri}`);
    return require("../../assets/images/avatar.png");
  };

  const handleError = () => {
    setError(true);
    setImageLoadState('error');
    devLog('GENERAL', `Avatar image failed to load for ${alt || 'unnamed user'} - imageSource: ${JSON.stringify(imageSource)}`);
  };

  const handleImageLoad = () => {
    setImageLoadState('success');
    devLog('GENERAL', `Avatar image loaded successfully for ${alt || 'unnamed user'} - imageSource: ${typeof imageSource === 'string' ? imageSource : 'object/number'}`);
  };

  const handlePress = () => {
    if (expandable) {
      setIsExpanded(true);
    }
  };

  const handleCloseModal = () => {
    setIsExpanded(false);
  };

  const AvatarContent = () => (
    <View
      style={[
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: showRing ? ringThickness : 0,
          borderColor: showRing ? ringColor : "#F2F2F7",
        },
        style,
      ]}>
      {/* Inner Profile Picture or Text Fallback */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: shouldShowTextFallback ? "#6366F1" : "#F2F2F7",
        }}>
        {shouldShowTextFallback ? (
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: innerSize * 0.4,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {getFallbackText()}
          </Text>
        ) : (
          <Image
            source={getFormattedSource()}
            style={{
              width: innerSize,
              height: innerSize,
            }}
            onError={handleError}
            onLoad={handleImageLoad}
          />
        )}
      </View>
    </View>
  );

  return (
    <>
      {expandable ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <AvatarContent />
        </TouchableOpacity>
      ) : (
        <AvatarContent />
      )}

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={handleCloseModal}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {/* Close button */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Expanded Avatar */}
              <View style={styles.expandedAvatarContainer}>
                <View
                  style={[
                    styles.expandedAvatar,
                    {
                      width: expandedSize,
                      height: expandedSize,
                      borderRadius: expandedSize / 2,
                      borderWidth: showRing ? ringThickness * 2 : 0,
                      borderColor: showRing ? ringColor : "transparent",
                      backgroundColor: shouldShowTextFallback ? "#6366F1" : "#F2F2F7",
                    }
                  ]}
                >
                  {shouldShowTextFallback ? (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: (expandedSize - (showRing ? ringThickness * 4 : 0)) * 0.3,
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      {getFallbackText()}
                    </Text>
                  ) : (
                    <Image
                      source={getFormattedSource()}
                      style={{
                        width: expandedSize - (showRing ? ringThickness * 4 : 0),
                        height: expandedSize - (showRing ? ringThickness * 4 : 0),
                        borderRadius: (expandedSize - (showRing ? ringThickness * 4 : 0)) / 2,
                      }}
                      resizeMode="cover"
                      onError={handleError}
                      onLoad={handleImageLoad}
                    />
                  )}
                </View>
                
                {/* Display name if provided */}
                {alt && (
                  <Text style={styles.expandedAvatarName}>{alt}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -80,
    right: -10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  expandedAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  expandedAvatarName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
});

// Optimized comparison function for memo
const areEqual = (prevProps: AvatarProps, nextProps: AvatarProps) => {
  // Fast path: check primitive props first
  if (
    prevProps.uri !== nextProps.uri ||
    prevProps.alt !== nextProps.alt ||
    prevProps.size !== nextProps.size ||
    prevProps.ringColor !== nextProps.ringColor ||
    prevProps.ringThickness !== nextProps.ringThickness ||
    prevProps.gapSize !== nextProps.gapSize ||
    prevProps.fallback !== nextProps.fallback ||
    prevProps.showRing !== nextProps.showRing ||
    prevProps.expandable !== nextProps.expandable ||
    prevProps.expandedSize !== nextProps.expandedSize ||
    prevProps.showTextFallback !== nextProps.showTextFallback ||
    prevProps.fallbackText !== nextProps.fallbackText
  ) {
    return false;
  }

  // Check imageSource (most common change)
  const prevImageSource = prevProps.imageSource;
  const nextImageSource = nextProps.imageSource;

  if (prevImageSource !== nextImageSource) {
    // For string values, compare directly
    if (typeof prevImageSource === 'string' && typeof nextImageSource === 'string') {
      return prevImageSource === nextImageSource;
    }

    // For objects, check uri property specifically
    if (typeof prevImageSource === 'object' && typeof nextImageSource === 'object' &&
        prevImageSource && nextImageSource) {
      const prevUri = 'uri' in prevImageSource ? prevImageSource.uri : null;
      const nextUri = 'uri' in nextImageSource ? nextImageSource.uri : null;
      if (prevUri !== nextUri) {
        return false;
      }
    } else {
      return false; // Different types or one is null
    }
  }

  // Shallow style comparison (avoid deep JSON.stringify)
  if (prevProps.style !== nextProps.style) {
    // If both are objects, do shallow comparison of common style props
    if (typeof prevProps.style === 'object' && typeof nextProps.style === 'object' &&
        prevProps.style && nextProps.style) {
      const styleProps = ['width', 'height', 'borderRadius', 'backgroundColor', 'marginTop', 'marginLeft'];
      for (const styleProp of styleProps) {
        if (prevProps.style[styleProp] !== nextProps.style[styleProp]) {
          return false;
        }
      }
    } else {
      return false; // Different types or references
    }
  }

  return true; // Props are equivalent
};

export default memo(Avatar, areEqual);