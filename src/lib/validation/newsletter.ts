import { z } from "zod";

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be at most 100 characters long")
    .email("Please enter a valid email address"),
});


export const newsletterVerifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be at most 100 characters long")
    .email("Please enter a valid email address"),
  code: z
    .string()
    .trim()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
  categories: z
    .array(z.string())
    .optional()
    .default([]),
});

