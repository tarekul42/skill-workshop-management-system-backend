import z from "zod";
declare const createEnrollmentZodSchema: z.ZodObject<{
    workshop: z.ZodString;
    studentCount: z.ZodNumber;
}, z.z.core.$strip>;
declare const updateEnrollmentStatusZodSchema: z.ZodObject<{
    status: z.ZodEnum<{
        [x: string]: string;
    }>;
}, z.z.core.$strip>;
export { createEnrollmentZodSchema, updateEnrollmentStatusZodSchema };
