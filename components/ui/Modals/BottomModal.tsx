
import React, { useEffect, useRef } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, Animated, Easing, PanResponder, Dimensions } from "react-native";
import { Colors } from "@/constants/Colors";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface BottomModalProps {
	visible: boolean;
	onClose: () => void;
	title: string;
	options?: Array<{
		label: string;
		value: string;
		icon?: any;
	}>;
	children: any;
	onSelect?: (value: string) => void;
	bottomSpaceHeight: number;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = 100; // How far down to swipe to close
const DRAG_DAMPING = 0.8; // How much to dampen the drag (0-1)

const BottomModal: React.FC<BottomModalProps> = ({ visible, onClose, title, options, onSelect, children, bottomSpaceHeight }) => {
	const { theme } = useCustomTheme();
	const styles = getStyles(theme);
	const slideAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const panY = useRef(new Animated.Value(0)).current;
	const modalHeight = useRef(0);

	// Measure modal height when layout is known
	const handleLayout = (event: any) => {
		const { height } = event.nativeEvent.layout;
		modalHeight.current = height;
	};

	// Pan responder for drag gesture
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (_, gestureState) => {
				// Only allow dragging downward
				if (gestureState.dy > 0) {
					panY.setValue(gestureState.dy * DRAG_DAMPING);
				}
			},
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dy > SWIPE_THRESHOLD) {
					handleClose();
				} else {
					// Return to original position
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
			panY.setValue(0); // Reset panY for next open
			onClose();
		});
	};

	useEffect(() => {
		if (visible) {
			// Reset animations
			slideAnim.setValue(0);
			fadeAnim.setValue(0);

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
	}, [visible, slideAnim, fadeAnim]);

	const translateY = panY.interpolate({
		inputRange: [-1, 0, 1],
		outputRange: [0, 0, 1],
	});

	const animatedTranslateY = Animated.add(
		slideAnim.interpolate({
			inputRange: [0, 1],
			outputRange: [SCREEN_HEIGHT, 0],
		}),
		translateY
	);

	const animatedOpacity = fadeAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
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
						transform: [{ translateY: animatedTranslateY }],
					},
				]}
				onLayout={handleLayout}
				{...panResponder.panHandlers}>
				<View style={styles.modalContent}>
					{/* Drag handle */}
					{/* <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View> */}

					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>{title}</Text>
						<TouchableOpacity onPress={handleClose}>
							<Text style={styles.closeButton}>✕</Text>
						</TouchableOpacity>
					</View>

					<View style={{ margin: 20 }}>{children}</View>
				</View>
			</Animated.View>
		</Modal>
	);
};

const getStyles = (theme: string) =>
	StyleSheet.create({
		overlay: {
			...StyleSheet.absoluteFillObject,
			backgroundColor: "rgba(0, 0, 0, 0.68)",
		},
		modalContainer: {
			position: "absolute",
			bottom: 0,
			width: "100%",
		},
		modalContent: {
			backgroundColor: theme === "dark" ? Colors.dark.background : Colors.light.background,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingBottom: 16,
			borderBottomWidth: 0.5,
			borderBottomColor: theme === "dark" ? Colors.dark.borderColor : Colors.light.borderColor,
			padding: 20,
		},
		title: {
			fontSize: 20,
			fontWeight: "800",
			color: theme === "dark" ? Colors.dark.textBold : Colors.light.textBold,
			fontFamily: "Rubik",
		},
		closeButton: {
			fontSize: 14,
			fontFamily: "Rubik",
			color: theme === "dark" ? "#DFE5E8" : "#35393B",
		},
		dragHandleContainer: {
			width: "100%",
			alignItems: "center",
			paddingVertical: 8,
		},
		dragHandle: {
			width: 40,
			height: 4,
			borderRadius: 2,
			backgroundColor: theme === "dark" ? "#DFE5E8" : "#35393B",
			opacity: 0.5,
		},
	});

export default BottomModal;
