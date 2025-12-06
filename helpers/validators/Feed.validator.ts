import { z } from "zod";

export const commentFeedSchema = z.object({
    text: z.string({ required_error: "Text is required" }),
});