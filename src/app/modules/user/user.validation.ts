import z from "zod";
import { IsActive, UserRole } from "./user.interface";

const createUserZodSchema = z.object({
  name: z
    .string("Name must be string")
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string("Email must be string")
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: z
    .string("Password must be string")
    .min(6, { message: "Password must be at least 6 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
  phone: z
    .string("Phone Number must be string")
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  age: z
    .number("Age must be a number")
    .min(0, { message: "Age cannot be negative." })
    .optional(),
  address: z
    .string("Address must be string")
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});

const updateUserZodSchema = z.object({
  name: z
    .string("Name must be string")
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),
  password: z
    .string("Password must be string")
    .min(6, { message: "Password must be at least 6 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    })
    .optional(),
  phone: z
    .string("Phone Number must be string")
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  age: z
    .number("Age must be a number")
    .min(0, { message: "Age cannot be negative." })
    .optional(),
  address: z
    .string("Address must be string")
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
  isDeleted: z.boolean("isDeleted must be true or false").optional(),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
  isVerified: z.boolean("isVerified must be true or false").optional(),
  role: z.enum(Object.values(UserRole) as [string]).optional(),
});

export { createUserZodSchema, updateUserZodSchema };
