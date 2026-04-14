import { z } from "zod";
const createLevelZodSchema = z.object({
    name: z.string().min(1, { message: "Level name is required" }),
});
const updateLevelZodSchema = z.object({
    name: z.string().min(1, { message: "Level name cannot be empty" }).optional(),
});
const dateSchema = z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
}, { message: "Must be a valid date string" });
const createWorkshopZodSchema = z
    .object({
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
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
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
})
    .refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "startDate must be before endDate",
    path: ["endDate"],
})
    .refine((data) => {
    if (data.startDate) {
        return new Date(data.startDate) > new Date();
    }
    return true;
}, {
    message: "startDate must be in the future",
    path: ["startDate"],
});
const updateWorkshopZodSchema = z
    .object({
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
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
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
})
    .refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "startDate must be before endDate",
    path: ["endDate"],
})
    .refine((data) => {
    if (data.startDate) {
        return new Date(data.startDate) > new Date();
    }
    return true;
}, {
    message: "startDate must be in the future",
    path: ["startDate"],
});
export { createLevelZodSchema, createWorkshopZodSchema, updateLevelZodSchema, updateWorkshopZodSchema, };
