import z from "zod";

const createCategoryZodSchema = z.object({
  name: z.string().min(1).max(100),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
});

const updateCategoryZodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
});

export { createCategoryZodSchema, updateCategoryZodSchema };
