import { z } from "zod";

const createLevelZodSchema = z.object({
  name: z.string().min(1, { message: "Level name is required" }),
});

const createWorkshopZodSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number" }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string().min(1, { message: "Level is required" }),
  whatYouLearn: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  syllabus: z.array(z.string()).optional(),
  maxSeats: z.number().int().min(1, { message: "Max seats must be at least 1" }).optional(),
  minAge: z.number().int().min(0, { message: "Min age cannot be negative" }).optional(),
  category: z.string().min(1, { message: "Category is required" }),
});

const updateWorkshopZodSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number" }).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string().min(1, { message: "Level cannot be empty" }).optional(),
  whatYouLearn: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  syllabus: z.array(z.string()).optional(),
  maxSeats: z.number().int().min(1, { message: "Max seats must be at least 1" }).optional(),
  minAge: z.number().int().min(0, { message: "Min age cannot be negative" }).optional(),
  category: z.string().min(1, { message: "Category cannot be empty" }).optional(),
  images: z.array(z.string().url()).optional(),
  deleteImages: z.array(z.string()).optional(),
});

export {
  createLevelZodSchema,
  createWorkshopZodSchema,
  updateWorkshopZodSchema,
};
