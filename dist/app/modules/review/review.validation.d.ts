import z from "zod";
declare const createReviewZodSchema: z.ZodObject<{
    workshop: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodString;
    content: z.ZodString;
}, z.z.core.$strip>;
declare const updateReviewZodSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, z.z.core.$strip>;
declare const updateReviewStatusZodSchema: z.ZodObject<{
    status: z.ZodEnum<{
        [x: string]: string;
    }>;
}, z.z.core.$strip>;
declare const getReviewsQueryZodSchema: z.ZodObject<{
    page: z.ZodDefault<z.z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.z.ZodCoercedNumber<unknown>>;
    sort: z.ZodDefault<z.ZodEnum<{
        oldest: "oldest";
        highest: "highest";
        lowest: "lowest";
        newest: "newest";
    }>>;
}, z.z.core.$strip>;
export { createReviewZodSchema, getReviewsQueryZodSchema, updateReviewStatusZodSchema, updateReviewZodSchema, };
