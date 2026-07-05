import { z } from "zod";

export const sendOtpZodSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpZodSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1, "OTP is required"),
});
