import { z } from "zod";

export const updateUsernameSchema = z.object({
	firstName: z.string({ required_error: "First name is required" }).min(2, "First Name should be at least 2 characters long"),
	lastName: z.string({ required_error: "First name is required" }).min(2, "Last Name should be at least 2 characters long"),
});

export const updatePhoneNumberSchema = z.object({
	phone: z.string({ required_error: "Phone number is required" }).min(10, "Phone number should be at least 10 characters long"),
});
