import { z } from "zod";

export const registerWithPhoneSchema = z.object({
	phone: z.string({ required_error: "Phone number is required" }).min(10, "Phone number should be at least 10 characters long"),
});

export const registerWithEmailSchema = z.object({
	email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
	otp: z.string({ required_error: "First name is required" }).min(4, "First Name should be at least 2 characters long"),
});

export const createPasswordSchema = z.object({
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/\d/, "Password must contain a number")
		.regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain a symbol"),

	// confirmPassword: z
	//   .string({ required_error: "Password is required" })
	//   .min(8, "Password should be at least 8 characters long"),
});

export const updateFullNameSchema = z.object({
	firstName: z.string({ required_error: "First name is required" }).min(2, "First Name should be at least 2 characters long"),
	lastName: z.string({ required_error: "First name is required" }).min(2, "Last Name should be at least 2 characters long"),
});

export const updateUsernameSchema = z.object({
	username: z
		.string({ required_error: "Username is required" })
		.min(2, "Username should be at least 2 characters long")
		.max(20, "Username should not exceed 20 characters") // Optional limit
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const loginSchema = z.object({
	email: z.string({ required_error: "Email is required" }).email("Invalid email address"),
	password: z.string({ required_error: "Password is required" }).min(3, "Password should be at least 8 characters long"),
});

export const phoneLoginSchema = z.object({
	phoneNumber: z.string({ required_error: "Phone number is required" }).regex(/^\d{10,15}$/, "Invalid phone number"),
	// phoneNumber: z.string({ required_error: "Phone number is required" }).min(10, "Phone number should be at least 10 characters long"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
	forgotPasswordEmail: z.string({ required_error: "Email is required" }).email("Invalid email address"),
});

export const resetPasswordSchema = z
	.object({
		password: z.string({ required_error: "Password is required" }).min(8, "Password should be at least 8 characters long"),
		confirmPassword: z.string({ required_error: "Password is required" }).min(8, "Password should be at least 8 characters long"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"],
	});

export const changePasswordSchema = z
	.object({
		newPassword: z.string({ required_error: "Password is required" }).trim().min(8, "Password should be at least 8 characters long"),
		confirmPassword: z.string({ required_error: "Password is required" }).trim().min(8, "Password should be at least 8 characters long"),
		currentPassword: z.string({ required_error: "Password is required" }).trim().min(8, "Password should be at least 8 characters long"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"],
	})
	.refine((data) => data.newPassword !== data.currentPassword, {
		message: "Passwords must match",
		path: ["password"],
	});
