import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(5, "Password must be at least 6 characters long."),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

