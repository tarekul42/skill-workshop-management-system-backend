"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkshopZodSchema = exports.createWorkshopZodSchema = exports.createLevelZodSchema = void 0;
const zod_1 = require("zod");
const createLevelZodSchema = zod_1.z.object({
    name: zod_1.z.string(),
});
exports.createLevelZodSchema = createLevelZodSchema;
const createWorkshopZodSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    level: zod_1.z.string(),
    whatYouLearn: zod_1.z.array(zod_1.z.string()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    syllabus: zod_1.z.array(zod_1.z.string()).optional(),
    maxSeats: zod_1.z.number().optional(),
    minAge: zod_1.z.number().optional(),
    category: zod_1.z.string(),
});
exports.createWorkshopZodSchema = createWorkshopZodSchema;
const updateWorkshopZodSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    level: zod_1.z.string().optional(),
    whatYouLearn: zod_1.z.array(zod_1.z.string()).optional(),
    prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    syllabus: zod_1.z.array(zod_1.z.string()).optional(),
    maxSeats: zod_1.z.number().optional(),
    minAge: zod_1.z.number().optional(),
    category: zod_1.z.string().optional(),
});
exports.updateWorkshopZodSchema = updateWorkshopZodSchema;
