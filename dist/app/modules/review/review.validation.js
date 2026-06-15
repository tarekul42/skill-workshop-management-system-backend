import z from "zod";
import { REVIEW_STATUS } from "./review.interface.js";
const createReviewZodSchema = z.object({
    workshop: z.string().min(1, "Workshop ID is required"),
    rating: z
        .number()
        .int()
        .min(1, "Rating must be at least 1")
        .max(5, "Rating must be at most 5"),
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(120, "Title must be at most 120 characters"),
    content: z
        .string()
        .min(10, "Review content must be at least 10 characters")
        .max(2000, "Review content must be at most 2000 characters"),
});
const updateReviewZodSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(3).max(120).optional(),
    content: z.string().min(10).max(2000).optional(),
});
const updateReviewStatusZodSchema = z.object({
    status: z.enum(Object.values(REVIEW_STATUS)),
});
const getReviewsQueryZodSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});
export { createReviewZodSchema, getReviewsQueryZodSchema, updateReviewStatusZodSchema, updateReviewZodSchema, };
