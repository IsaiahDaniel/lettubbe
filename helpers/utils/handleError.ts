import showToast from "./showToast";

export const handleGetError = (error: any) => {
	// console.log("error", error);
	if (error?.response == undefined) {
		return error.message;
	} else if (error?.response?.data?.error) {
		return error?.response?.data?.error;
	} else {
		return "Something went Wrong";
	}
};

export const handleError = (error: any) => {
	console.log("error handle error", JSON.stringify(error, null, 2));
	if (error?.data) {
		const errorMessage = error.data?.error || error.data?.message;
		showToast("error", errorMessage);
	} else if (error?.request) {
		
		showToast("error", "No response received from server. Please try again later.");
	} else {
		showToast("error", "Something went wrong. Please try again later.");
	}
};

export const handleErrorMessage = (error: any) => {
	console.log("error handle error", JSON.stringify(error, null, 2));
	if(error){
		showToast("error", error);
	}
};