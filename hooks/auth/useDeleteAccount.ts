import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "@/services/auth.service";
import { handleError } from "../../helpers/utils/handleError";
import showToast from "../../helpers/utils/showToast";
import useAuth from "./useAuth";

const useDeleteAccount = () => {
	const [deleteError, setDeleteError] = useState<{ show: boolean; msg: string }>({
		show: false,
		msg: "",
	});

	const router = useRouter();
	const { logout } = useAuth();
	const [reasonText, setReasonText] = useState("");

	const [modalVisibility, setModalVisibility] = useState<boolean>(false);

	const handleSubmit = () => {
		setModalVisibility(true);
	};

	const { mutate, isPending, isError, error } = useMutation({
		mutationFn: () => deleteAccount(reasonText),
		mutationKey: ["deleteAccount"],
		onSuccess: () => {
			setModalVisibility(false);
			showToast('success', 'Account deletion initiated. You will be signed out.');
			logout();
		},
		onError: (err: any) => {
			handleError(err);
		},
	});

	const handleDeleteAccount = () => {
		mutate();
	};

	return {
		isPending,
		isError,
		error,
		reasonText,
		setReasonText,
		modalVisibility,
		setModalVisibility,
		handleDeleteAccount,
		deleteError,
		setDeleteError,
		router,
		handleSubmit,
	};
};

export default useDeleteAccount;
