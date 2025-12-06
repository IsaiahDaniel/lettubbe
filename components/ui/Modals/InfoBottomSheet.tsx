import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity, Image, View, PanResponder } from "react-native";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants/Colors";
import Icons from "@/constants/Icons";

interface InfoBottomSheetProps {
	visible: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = 100;
const DRAG_DAMPING = 0.8;

const InfoBottomSheet: React.FC<InfoBottomSheetProps> = ({ visible, onClose, children }) => {
	const { theme } = useCustomTheme();
	const slideAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const panY = useRef(new Animated.Value(0)).current;
	const modalHeight = useRef(0);
	const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

	// Track orientation changes
	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setScreenDimensions(window);
		});
		
		return () => subscription?.remove();
	}, []);

	const isLandscape = screenDimensions.width > screenDimensions.height;

	const handleLayout = (event: any) => {
		const { height } = event.nativeEvent.layout;
		modalHeight.current = height;
	};

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gestureState) => {
				if (gestureState.dy > 0) {
					panY.setValue(gestureState.dy * DRAG_DAMPING);
				}
			},
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dy > SWIPE_THRESHOLD) {
					handleClose();
				} else {
					Animated.spring(panY, {
						toValue: 0,
						useNativeDriver: true,
					}).start();
				}
			},
		})
	).current;

	const handleClose = () => {
		// Animate out
		Animated.parallel([
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 250,
				easing: Easing.out(Easing.ease),
				useNativeDriver: true,
			}),
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 250,
				easing: Easing.out(Easing.ease),
				useNativeDriver: true,
			}),
		]).start(() => {
			panY.setValue(0);
			onClose();
		});
	};

	useEffect(() => {
		if (visible) {
			// Reset all animations
			slideAnim.setValue(0);
			fadeAnim.setValue(0);
			panY.setValue(0);

			// Animate in
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 1,
					duration: 300,
					easing: Easing.out(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					easing: Easing.out(Easing.ease),
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible, slideAnim, fadeAnim, panY]);

	const animatedTranslateY = Animated.add(
		slideAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [isLandscape ? screenDimensions.width : screenDimensions.height, 0],
		}),
		panY
	);

	const animatedTranslateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [isLandscape ? screenDimensions.width : 0, 0],
	});

	const animatedOpacity = fadeAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
	});

	const styles = StyleSheet.create({
		overlay: {
			...StyleSheet.absoluteFillObject,
			backgroundColor: "rgba(0, 0, 0, 0.3)",
		},
		modalContainer: {
			position: "absolute",
			...(isLandscape ? {
				right: 0,
				top: 0,
				bottom: 0,
				width: "100%",
				height: "100%",
			} : {
				bottom: 0,
				width: "100%",
			}),
		},
		modalContent: {
			backgroundColor: theme === "dark" ? Colors.dark.background : Colors.light.background,
			...(isLandscape ? {
				flex: 1,
				flexDirection: 'row',
				borderRadius: 0,
			} : {
				borderTopLeftRadius: 20,
				borderTopRightRadius: 20,
			}),
			overflow: 'hidden', // Ensuring image respects border radius
			position: 'relative',
		},
		closeButton: {
			position: 'absolute',
			top: 12,
			right: 12,
			zIndex: 1000,
			width: 36,
			height: 36,
			borderRadius: 18,
			justifyContent: 'center',
			alignItems: 'center',
		},
		closeIcon: {
			width: 34,
			height: 34,
		},
	});

	return (
		<Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
			{/* Animated overlay */}
			<Animated.View style={[styles.overlay, { opacity: animatedOpacity }]}>
				<Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
			</Animated.View>

			{/* Animated content */}
			<Animated.View
				style={[
					styles.modalContainer,
					{
						transform: isLandscape 
							? [{ translateX: animatedTranslateX }]
							: [{ translateY: animatedTranslateY }],
					},
				]}
				onLayout={handleLayout}
				{...panResponder.panHandlers}
			>
				<Animated.View style={styles.modalContent}>
					{children}
					
					{/* Close Button */}
					{/* <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
						<Image 
							source={Icons.closeCircle} 
							style={styles.closeIcon}
						/>
					</TouchableOpacity> */}
				</Animated.View>
			</Animated.View>
		</Modal>
	);
};

export default InfoBottomSheet;