export const handleSuccess = (message: string, setShowToast: any) => {
	// console.log("message", message);
	if (message) {
		setShowToast({ show: true, msg: message });
	} else {
		setShowToast({ show: true, msg: "SuccessFull" });
	}
};
