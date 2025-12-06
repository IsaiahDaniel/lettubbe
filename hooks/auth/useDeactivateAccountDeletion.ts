import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { handleError } from "../../helpers/utils/handleError";
import { deactivateAccountDeletion } from "@/services/auth.service";

const useDeactivateAccountDeletion = (refetch: any) => {
	const { mutate, isPending, error, isError } = useMutation({
		mutationFn: () => deactivateAccountDeletion(),
		mutationKey: ["deactivateAccountDeletion"],
		onSuccess: () => {
			refetch();
		},
		onError: (error: AxiosError) => {
			console.error("Error deactivating account deletion:", error);
			handleError(error);
		},
	});

	const handleDeactivateAccountDeletion = () => {
		mutate();
	};

	return {
		mutate,
		handleDeactivateAccountDeletion,
		isPending,
		error,
		isError,
	};
};

export default useDeactivateAccountDeletion;
