import { View, Pressable } from "react-native";
import React, { useState } from "react";
import Typography from "@/components/ui/Typography/Typography";
import KeyboardWrapper from "@/components/utilities/KeyboardWrapper";
import AppButton from "@/components/ui/AppButton";
import { Controller } from "react-hook-form";
import BackButton from "@/components/utilities/BackButton";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import { formatDate } from "@/helpers/utils/util";
import { useEnterAge } from "@/hooks/auth/useEnterAge";
import SlidingDatePicker from "@/components/ui/SlidingDatePicker";

const EnterAge = () => {
	const { theme } = useCustomTheme();
	const { control, handleNext, onDateChange, maxDate, minDate, isPending, setValue, isFormValid } = useEnterAge();
	const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

	const showDatePicker = () => {
		setIsDatePickerVisible(true);
	};

	const hideDatePicker = () => {
		setIsDatePickerVisible(false);
	};

	const handleDateSelect = (date: Date) => {
		onDateChange(null, date);
		setValue('birthDate', date);
		hideDatePicker();
	};

	return (
		<KeyboardWrapper>
			<BackButton />
			<View style={{ flex: 1, marginTop: 16 }}>
				<Typography textType="textBold" weight="600" size={24} lineHeight={33} style={{ marginBottom: 4 }}>
					What's your birth date?
				</Typography>
				<Typography>This is to personalize your experience and will not be visible on your profile</Typography>

				<View style={{ marginTop: 24 }}>
					<Controller
						control={control}
						name="birthDate"
						render={({ field: { value } }) => (
							<>
								<Pressable
									onPress={showDatePicker}
									style={{
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										width: "100%",
										paddingHorizontal: 16,
										borderRadius: 15,
										borderColor: value ? Colors.general.primary : Colors[theme].borderColor,
										borderWidth: value ? 2 : 1,
										height: 56,
										backgroundColor: Colors[theme].inputBackground,
										marginBottom: 20,
										transform: [{ scale: value ? 1.02 : 1 }],
									}}>
									<Typography 
										size={16}
										weight={value ? "600" : "400"}
										color={value ? Colors[theme].textBold : Colors[theme].textLight}
									>
										{value ? (value as Date).toLocaleDateString('en-US', { 
											year: 'numeric', 
											month: 'long', 
											day: 'numeric' 
										}) : "Select your birthday"}
									</Typography>
								</Pressable>

								<SlidingDatePicker
									isVisible={isDatePickerVisible}
									onClose={hideDatePicker}
									onDateSelect={handleDateSelect}
									initialDate={value as Date | null}
									minimumDate={minDate}
									maximumDate={maxDate}
								/>
							</>
						)}
					/>
				</View>
			</View>
			<AppButton 
				title="Next" 
				handlePress={handleNext} 
				isLoading={isPending} 
				disabled={!isFormValid}
				style={{ 
					marginBottom: 16,
					opacity: isFormValid ? 1 : 0.5 
				}} 
			/>
		</KeyboardWrapper>
	);
};

export default EnterAge;
