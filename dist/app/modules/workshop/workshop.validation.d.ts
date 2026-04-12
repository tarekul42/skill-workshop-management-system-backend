import { z } from "zod";
declare const createLevelZodSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
declare const updateLevelZodSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const createWorkshopZodSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    level: z.ZodString;
    whatYouLearn: z.ZodOptional<z.ZodArray<z.ZodString>>;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString>>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString>>;
    syllabus: z.ZodOptional<z.ZodArray<z.ZodString>>;
    maxSeats: z.ZodOptional<z.ZodNumber>;
    minAge: z.ZodOptional<z.ZodNumber>;
    category: z.ZodString;
}, z.core.$strip>;
declare const updateWorkshopZodSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodString>;
    whatYouLearn: z.ZodOptional<z.ZodArray<z.ZodString>>;
    prerequisites: z.ZodOptional<z.ZodArray<z.ZodString>>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString>>;
    syllabus: z.ZodOptional<z.ZodArray<z.ZodString>>;
    maxSeats: z.ZodOptional<z.ZodNumber>;
    minAge: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deleteImages: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export { createLevelZodSchema, createWorkshopZodSchema, updateLevelZodSchema, updateWorkshopZodSchema, };
