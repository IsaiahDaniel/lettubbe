import { handleError } from "@/helpers/utils/handleError";
import showToast from "@/helpers/utils/showToast";
import { getData, storeData } from "@/helpers/utils/storage";
import { saveDob } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform } from "react-native";

export const useEnterAge = () => {
	const [registerData, setRegisterData] = useState<any>();

	// get the email from local storage
	useEffect(() => {
		getData<any>("registerData").then((data) => {
			setRegisterData(data);
		});
	}, []);
	// Use a try-catch block to initialize the form to catch any errors
	const { control, setValue, watch, handleSubmit } = useForm<{
		birthDate: Date | null;
	}>({
		defaultValues: {
			birthDate: null,
		},
	});

	const [showDatePicker, setShowDatePicker] = useState(Platform.OS === "ios");
	const birthDate = watch("birthDate");

	// Validate the component is loaded correctly
	useEffect(() => {
		try {
			// Ensure the date picker can be initialized
			const testDate = new Date();
			// console.log("Component loaded successfully", testDate);
		} catch (error) {
			console.error("Error initializing component:", error);
			// Alert.alert("Error", "There was a problem loading this screen.");
		}
	}, []);

	const calculateAge = (birthday: Date): number => {
		try {
			const ageDifMs = Date.now() - birthday.getTime();
			const ageDate = new Date(ageDifMs);
			return Math.abs(ageDate.getUTCFullYear() - 1970);
		} catch (error) {
			console.error("Error calculating age:", error);
			return 0;
		}
	};

	interface DateChangeEvent {
		type: string;
	}

	const onDateChange = (event: DateChangeEvent | null, selectedDate?: Date) => {
		try {
			// Don't proceed if the event was dismissed (Android)
			if (event && event.type === "dismissed") {
				if (Platform.OS === "android") {
					setShowDatePicker(false);
				}
				return;
			}

			const currentDate = selectedDate || birthDate;

			// Hide the date picker on Android
			if (Platform.OS === "android") {
				setShowDatePicker(false);
			}

			// Update the form value
			setValue("birthDate", currentDate);
		} catch (error) {
			console.error("Error changing date:", error);
			// Alert.alert("Error", "There was a problem selecting the date.");
		}
	};

	const showDatepicker = () => {
		setShowDatePicker(true);
	};

	const { mutate, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: (formData: any) => saveDob(formData),
		mutationKey: ["saveDob"],
		onSuccess: (data) => {
			// console.log("Age updated successfully:", data.data.token);
			storeData("userInfo", data?.data);
			storeData("token", data.data.token);
			
			// Store refresh token if provided
			if (data.data.refreshToken) {
				storeData("refreshToken", data.data.refreshToken);
			}
			
			// Store login timestamp to prevent unnecessary refresh
			storeData("lastLoginTime", Date.now());
			
			router.push("/(auth)/AddPhoto");
		},
		onError: (error: AxiosError) => {
			handleError(error);
		},
	});

	const handleNext = () => {
		try {
			if (!birthDate) {
				showToast("error", "Please select your birth date.");
				return;
			}

			const age = calculateAge(birthDate);

			// Validate reasonable age
			if (age > 120) {
				showToast("error", "Please enter a valid birth date.");
				return;
			}

			// Navigate to next screen
			mutate({ dob: birthDate, email: registerData.email, phoneNumber: registerData.phone });
		} catch (error) {
			console.error("Error in handleNext:", error);
			// Alert.alert("Error", "There was a problem proceeding to the next step.");
		}
	};

	// Set max date to today
	const maxDate = new Date();

	// Set min date to today minus 120 years
	const minDate = new Date();
	minDate.setFullYear(minDate.getFullYear() - 120);

	return {
		control,
		setValue,
		showDatePicker,
		birthDate,
		handleNext,
		onDateChange,
		showDatepicker,
		handleSubmit,
		maxDate,
		minDate,
		isPending,
		isFormValid: !!birthDate,
	};
};
