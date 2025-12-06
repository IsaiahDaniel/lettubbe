export interface IRegister {
	type: string;
	email?: string;
	phoneNumber?: string;
}

export interface IVerifyOtp {
	[key: string]: string; // This allows for dynamic property names (email or phone)
	token: string;
	type: string;
}

export interface IResendOtp {
	[key: string]: string; // For email or phone
}

export interface ICreatePassword {
	email?: string;
	phone?: string;
	password: string;
}

export interface ILogin {
	email?: string;
	phoneNumber?: string;
	password: string;
}

export interface IUpdateFullName {
	firstName: string;
	lastName: string;
}

export interface IUpdateUsername {
	username: string;
}

// export interface IChangePassword {
// 	newPassword: string;
// 	currentPassword: string;
// 	confirmPassword: string;
// }

export interface IForgotPassword {
	[key: string]: string;
	type: string;
}

export interface IResetPassword {
	password: string;
	confirmPassword?: string;
}

// export interface IUserEmailTypeStore {
// 	email: string | null;
// 	setEmail: (email: string) => void;
// }

// export interface IUserOTPTypeStore {
// 	otp: string | null;
// 	setOTP: (email: string) => void;
// }
