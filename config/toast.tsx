import { BaseToast, ErrorToast, ToastProps } from "react-native-toast-message";
import { Colors } from "@/constants";
import CustomToast from "@/components/ui/CustomToast";

export const toastConfig = {
	success: (props: ToastProps) => (
		<CustomToast {...props} variant="success" />
	),

	error: (props: ToastProps) => (
		<CustomToast {...props} variant="error" />
	),
};