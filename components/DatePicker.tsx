import React, { useState } from "react";
import { View, Text, Platform, Button, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Typography from "./ui/Typography/Typography";

export default function DatePicker() {
	// State to store the selected date
	const [date, setDate] = useState(new Date());

	// State to control the visibility of the date picker
	const [showDatePicker, setShowDatePicker] = useState(false);

	// Function to handle date selection
	const onDateChange = (event, selectedDate) => {
		const currentDate = selectedDate || date;

		// Hide the date picker on both platforms
		setShowDatePicker(Platform.OS === "ios");

		// Update the selected date
		setDate(currentDate);
	};

	// Function to show the date picker
	const showDatepicker = () => {
		setShowDatePicker(true);
	};

	return (
		<View style={styles.container}>
			<Typography style={styles.dateText}>Selected Date: {date.toLocaleDateString()}</Typography>

			{Platform.OS === "ios" ? (
				// For iOS, show the picker inline
				<DateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} display="default" onChange={onDateChange} />
			) : (
				// For Android, show a button to trigger the picker
				<>
					<Button onPress={showDatepicker} title="Select Date" />
					{showDatePicker && (
						<DateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} display="default" onChange={onDateChange} />
					)}
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "red",
	},
	dateText: {
		fontSize: 18,
		marginBottom: 20,
		color: "blue",
	},
});
