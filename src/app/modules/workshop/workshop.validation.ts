import { z } from "zod";

const createLevelZodSchema = z.object({
  name: z.string(),
});

const createWorkshopZodSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string(),
  whatYouLearn: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  syllabus: z.array(z.string()).optional(),
  maxSeats: z.number().optional(),
  minAge: z.number().optional(),
  category: z.string(),
});

const updateWorkshopZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  price: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  level: z.string().optional(),
  whatYouLearn: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  syllabus: z.array(z.string()).optional(),
  maxSeats: z.number().optional(),
  minAge: z.number().optional(),
  category: z.string().optional(),
  deleteImages: z.array(z.string()).optional(),
});

export {
  createLevelZodSchema,
  createWorkshopZodSchema,
  updateWorkshopZodSchema,
};
