"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkshopZodSchema = exports.createWorkshopZodSchema = exports.createLevelZodSchema = void 0;
const zod_1 = require("zod");
const createLevelZodSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: "Level name is required" }),
});
exports.createLevelZodSchema = createLevelZodSchema;
const createWorkshopZodSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0, { message: "Price must be a positive number" }).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    level: zod_1.z.string().min(1, { message: "Level is required" }),
    whatYouLearn: zod_1.z.array(zod_1.z.string()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    syllabus: zod_1.z.array(zod_1.z.string()).optional(),
    maxSeats: zod_1.z.number().int().min(1, { message: "Max seats must be at least 1" }).optional(),
    minAge: zod_1.z.number().int().min(0, { message: "Min age cannot be negative" }).optional(),
    category: zod_1.z.string().min(1, { message: "Category is required" }),
});
exports.createWorkshopZodSchema = createWorkshopZodSchema;
const updateWorkshopZodSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title cannot be empty" }).optional(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    price: zod_1.z.number().min(0, { message: "Price must be a positive number" }).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    level: zod_1.z.string().min(1, { message: "Level cannot be empty" }).optional(),
    whatYouLearn: zod_1.z.array(zod_1.z.string()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    syllabus: zod_1.z.array(zod_1.z.string()).optional(),
    maxSeats: zod_1.z.number().int().min(1, { message: "Max seats must be at least 1" }).optional(),
    minAge: zod_1.z.number().int().min(0, { message: "Min age cannot be negative" }).optional(),
    category: zod_1.z.string().min(1, { message: "Category cannot be empty" }).optional(),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    deleteImages: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateWorkshopZodSchema = updateWorkshopZodSchema;
