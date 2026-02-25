import { z } from "zod";

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be at most 100 characters long")
    .email("Please enter a valid email address"),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;