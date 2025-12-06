import Toast from "react-native-toast-message";

type ToastType = "success" | "error";
const showToast = (type: ToastType, message: string, title?: string) => {
	let toastConfig = {
		type: type,
		visibilityTime: 2000,
		autoHide: true,
		topOffset: 100,
		text1: title,
		text2: title ? message : undefined,
	};

	// If no title is provided, use message as text1 (main text)
	if (!title) {
		toastConfig.text1 = message;
	}

	Toast.show({
		position: "top",
		...toastConfig,
	});
};

export default showToast;