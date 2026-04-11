import { z } from "zod";

export const sendOtpZodSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "At least one of email or phone is required",
  });

export const verifyOtpZodSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  otp: z.string().min(1, "OTP is required"),
});
