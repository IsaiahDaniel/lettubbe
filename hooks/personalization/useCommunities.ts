import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { AxiosError } from "axios";
import { handleError } from "../../helpers/utils/handleError";
import { useEffect, useState } from "react";
// import useAuth from "../auth/useAuth";
import { sendContacts } from "@/services/personalization.service";
import { IContacts } from "@/helpers/types/personalization/personalization.types";
import showToast from "@/helpers/utils/showToast";
import * as Contacts from "expo-contacts";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { setDate } from "date-fns";
import { storeData } from "@/helpers/utils/storage";

interface Contact {
	name: string;
	phone: string;
}

const useCommunities = () => {
	// const { userDetails } = useAuth();
	const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
	const [phoneContacts, setPhoneContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [appContacts, setAppContacts] = useState<Contact[]>([]);
	const { showError, alertConfig, isVisible, hideAlert } = useCustomAlert();

	const { mutate, isPending, isSuccess, isError, error } = useMutation({
		mutationFn: (formData: IContacts) => sendContacts(formData),
		mutationKey: ["sendContacts"],
		onSuccess: (data) => {
			// console.log("Successfully:", data);
			setAppContacts(data.data);
			showToast("success", data.message);
			storeData("isUserOnboarded", true);
		},
		onError: (error: AxiosError) => {
			handleError(error);
			// router.push("/(auth)/EnterAge");
		},
	});

	useEffect(() => {
		(async () => {
			// Request permission to access contacts
			const { status } = await Contacts.requestPermissionsAsync();

			if (status === "granted") {
				// Fetch contacts from the device
				const { data } = await Contacts.getContactsAsync({
					fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
				});

				if (data.length > 0) {
					// console.log("Contact data", data);

					// Format contacts to match your app's required structure
					const formattedContacts = data
						.filter((contact) => contact.name && contact.phoneNumbers && contact.phoneNumbers.length > 0)
						.map((contact) => ({
							name: contact.name,
							phone: contact.phoneNumbers && contact.phoneNumbers[0].number ? contact.phoneNumbers[0].number : "", // Just taking the first number for display
						}));

					setPhoneContacts(formattedContacts);

					// Extract all phone numbers into a single array
					const allPhoneNumbers = data.reduce<string[]>((numbers, contact) => {
						if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
							// Extract all numbers from each contact and add to our array
							const contactNumbers = contact.phoneNumbers
								.map((phoneInfo) => phoneInfo.number)
								.filter((number): number is string => number !== undefined);
							return [...numbers, ...contactNumbers];
						}
						return numbers;
					}, []);

					// console.log("All phone numbers:", allPhoneNumbers);
					mutate({ phoneNumbers: allPhoneNumbers });
				} else {
					showError("No contacts found", "There are no contacts on this device.");
				}
			} else {
				showError("Permission denied", "Please grant contacts permission to use this feature.");
			}

			setLoading(false);
		})();
	}, []);

	const selectContactHandler = (contact: string) => {
		if (selectedContacts.includes(contact)) {
			setSelectedContacts(selectedContacts.filter((item) => item !== contact));
		} else {
			setSelectedContacts([...selectedContacts, contact]);
		}
	};

	return {
		router,
		isPending,
		isError,
		error,
		isSuccess,
		selectContactHandler,
		loading,
		phoneContacts,
		selectedContacts,
		appContacts,
		alertConfig,
		isAlertVisible: isVisible,
		hideAlert,
	};
};

export default useCommunities;
