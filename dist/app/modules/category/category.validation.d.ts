import z from "zod";
declare const createCategoryZodSchema: z.ZodObject<{
    name: z.ZodString;
    thumbnail: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const updateCategoryZodSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export { createCategoryZodSchema, updateCategoryZodSchema };
