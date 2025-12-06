import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Pressable, ViewStyle, ActivityIndicator, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import Icons from "@/constants/Icons";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import showToast from "@/helpers/utils/showToast";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from "react-native-reanimated";

type NotificationOptionType = "all" | "personalized" | "none";

interface NotificationOption {
  id: NotificationOptionType;
  name: string;
  icon: string;
}

interface NotificationMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: NotificationOptionType) => void;
  selectedOption: NotificationOptionType;
}

interface SubscribeButtonProps {
  userId: string;
  initialIsSubscribed?: boolean;
  subscriberCount?: number;
  onSubscribe?: (userId: string) => Promise<void>;
  onUnsubscribe?: (userId: string) => Promise<void>;
  containerStyle?: ViewStyle;
  isLoading?: boolean;
  variant?: 'default' | 'icon-only';
}

// NotificationOptions shown when clicking on bell icon
const NotificationMenu: React.FC<NotificationMenuProps> = ({ visible, onClose, onSelect, selectedOption }) => {
  const { theme } = useCustomTheme();
  
  const options: NotificationOption[] = [
    { id: "all", name: "All", icon: "notifications-active" },
    { id: "personalized", name: "Personalized", icon: "notifications" },
    { id: "none", name: "None", icon: "notifications-off" }
  ];

  // Function to safely render icon based on Material Icons available names
  const renderIcon = (iconName: string) => {
    return <MaterialIcons 
      name={iconName as any} 
      size={24} 
      color={selectedOption === (iconName as any) ? Colors.general.primary : Colors[theme].textBold} 
    />;
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[
          styles.notificationMenu,
          { backgroundColor: Colors[theme].cardBackground }
        ]}>
          <Typography weight="600" style={styles.menuTitle}>Notifications</Typography>
          
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.menuOption,
                selectedOption === option.id && { backgroundColor: Colors[theme].cardBackground }
              ]}
              onPress={() => {
                onSelect(option.id);
                onClose();
              }}
            >
              {renderIcon(option.icon)}
              <Typography style={styles.optionText}>{option.name}</Typography>
              {selectedOption === option.id && (
                <MaterialIcons name={"check" as any} size={20} color={Colors.general.primary} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

// The main subscribe button component
const SubscribeButton: React.FC<SubscribeButtonProps> = ({ 
  userId, 
  initialIsSubscribed = false,
  subscriberCount = 0,
  onSubscribe,
  onUnsubscribe,
  containerStyle,
  isLoading = false,
  variant = 'default'
}) => {
  const { theme } = useCustomTheme();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(initialIsSubscribed);
  const [notificationOption, setNotificationOption] = useState<NotificationOptionType>("none");
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);
  const [subscribers, setSubscribers] = useState<number>(subscriberCount);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Animation values for bounce effect
  const scaleValue = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));
  
  // Update local state when props change
  useEffect(() => {
    setIsSubscribed(initialIsSubscribed);
  }, [initialIsSubscribed, userId]);

  useEffect(() => {
    setSubscribers(subscriberCount);
  }, [subscriberCount]);
  
  // Handle subscribe/unsubscribe action
  const toggleSubscription = async (): Promise<void> => {
    if (loading || isLoading) return;
    
    // Trigger bounce animation
    scaleValue.value = withSequence(
      withSpring(0.8, { duration: 100 }),
      withSpring(1.2, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );
    
    setLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe functionality
        if (onUnsubscribe) {
          await onUnsubscribe(userId);
        }
        setIsSubscribed(false);
        setNotificationOption("none");
        
        // Show unsubscribe toast
        showToast("success", "Unsubscribed successfully");
      } else {
        // Subscribe functionality
        if (onSubscribe) {
          await onSubscribe(userId);
        }
        setIsSubscribed(true);
        setNotificationOption("all"); // Default to "All" notifications
        
        // Show subscribe toast
        showToast("success", "Subscribed successfully");
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
      // Revert UI state on error
      setIsSubscribed(initialIsSubscribed);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle notification bell click
  const handleBellClick = (): void => {
    if (isSubscribed && !loading && !isLoading) {
      setShowNotificationMenu(true);
    }
  };
  
  // Get bell icon based on notification setting
  const getBellIcon = (): string => {
    if (!isSubscribed) return "";
    
    switch (notificationOption) {
      case "all":
        return "notifications-active";
      case "personalized":
        return "notifications";
      case "none":
        return "notifications-off";
      default:
        return "notifications";
    }
  };

  // Extract width from containerStyle if provided
  const containerWidth = containerStyle?.width;
  const hasCustomWidth = typeof containerWidth === 'number' || typeof containerWidth === 'string';

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <View style={[styles.container, containerStyle]}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={toggleSubscription}
            disabled={loading || isLoading}
            style={[
              styles.iconOnlyButton,
              {
                // backgroundColor: isSubscribed ? Colors.general.primary : 'rgba(255, 255, 255, 0.2)',
                opacity: (loading || isLoading) ? 0.7 : 1,
              }
            ]}
          >
            {loading || isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Image 
                source={Icons.subscribe} 
                style={[
                  styles.subscribeIcon,
                  { tintColor: isSubscribed ? Colors.general.primary : 'white' }
                ]}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Default variant
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Main container for subscribe button and bell */}
      <View style={[
        styles.buttonContainer,
        hasCustomWidth && { width: '100%' }
      ]}>
        {/* Bell icon (only shown when subscribed) */}
        {isSubscribed && (
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={handleBellClick}
            disabled={loading || isLoading}
          >
            <MaterialIcons 
              name={getBellIcon() as any} 
              size={20} 
              color={Colors[theme].textBold} 
            />
          </TouchableOpacity>
        )}
        
        {/* Subscribe/Subscribed button */}
        <TouchableOpacity
          onPress={toggleSubscription}
          disabled={loading || isLoading}
          style={[
            styles.subscribeButton,
            {
              backgroundColor: isSubscribed ? Colors[theme].cardBackground : Colors.general.primary,
              opacity: (loading || isLoading) ? 0.7 : 1,
              // Remove minWidth when custom width is provided
              ...(hasCustomWidth ? { 
                minWidth: undefined,
                flex: 1,
                marginLeft: isSubscribed ? 4 : 0
              } : {})
            }
          ]}
        >
          {loading || isLoading ? (
            <ActivityIndicator color={isSubscribed ? Colors[theme].textBold : Colors[theme].text} size="small" />
          ) : (
            <Typography
              weight="600"
              style={{
                color: isSubscribed ? Colors[theme].textBold : "#fff",
                fontSize: hasCustomWidth ? 12 : 14,
                textAlign: 'center'
              }}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Typography>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Notification options menu */}
      <NotificationMenu
        visible={showNotificationMenu}
        onClose={() => setShowNotificationMenu(false)}
        onSelect={setNotificationOption}
        selectedOption={notificationOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
  },
  bellButton: {
    padding: 6,
    marginRight: 4,
  },
  subscribeButton: {
    minWidth: 215,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOnlyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  subscribeIcon: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationMenu: {
    width: "80%",
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuTitle: {
    marginBottom: 16,
    fontSize: 18,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default SubscribeButton;