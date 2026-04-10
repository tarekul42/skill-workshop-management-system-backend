import { z } from "zod";

const createLevelZodSchema = z.object({
  name: z.string().min(1, { message: "Level name is required" }),
});

const createWorkshopZodSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z
    .string()
    .max(5000, { message: "Description cannot exceed 5000 characters" })
    .optional(),
  location: z.string().optional(),
  price: z
    .number()
    .min(0, { message: "Price must be a positive number" })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string().min(1, { message: "Level is required" }),
   whatYouLearn: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 learning outcomes allowed" })
    .optional(),
  prerequisites: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 prerequisites allowed" })
    .optional(),
  benefits: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 benefits allowed" })
    .optional(),
  syllabus: z
    .array(z.string().max(500))
    .max(50, { message: "Maximum 50 syllabus items allowed" })
    .optional(),
  maxSeats: z
    .number()
    .int()
    .min(1, { message: "Max seats must be at least 1" })
    .optional(),
  minAge: z
    .number()
    .int()
    .min(0, { message: "Min age cannot be negative" })
    .optional(),
  category: z.string().min(1, { message: "Category is required" }),
});

const updateWorkshopZodSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  description: z
    .string()
    .max(5000, { message: "Description cannot exceed 5000 characters" })
    .optional(),
  location: z.string().optional(),
  price: z
    .number()
    .min(0, { message: "Price must be a positive number" })
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string().min(1, { message: "Level cannot be empty" }).optional(),
  whatYouLearn: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 learning outcomes allowed" })
    .optional(),
  prerequisites: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 prerequisites allowed" })
    .optional(),
  benefits: z
    .array(z.string().max(200))
    .max(20, { message: "Maximum 20 benefits allowed" })
    .optional(),
  syllabus: z
    .array(z.string().max(500))
    .max(50, { message: "Maximum 50 syllabus items allowed" })
    .optional(),
  maxSeats: z
    .number()
    .int()
    .min(1, { message: "Max seats must be at least 1" })
    .optional(),
  minAge: z
    .number()
    .int()
    .min(0, { message: "Min age cannot be negative" })
    .optional(),
  category: z
    .string()
    .min(1, { message: "Category cannot be empty" })
    .optional(),
  images: z.array(z.string().url()).optional(),
  deleteImages: z.array(z.string()).optional(),
});

export {
  createLevelZodSchema,
  createWorkshopZodSchema,
  updateWorkshopZodSchema,
};
