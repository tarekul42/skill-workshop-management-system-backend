import z from "zod";
declare const createContactZodSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    subject: z.ZodString;
    message: z.ZodString;
}, z.z.core.$strip>;
declare const getAllContactsQueryZodSchema: z.ZodObject<{
    page: z.ZodDefault<z.z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.z.ZodCoercedNumber<unknown>>;
    isRead: z.ZodOptional<z.z.ZodCoercedBoolean<unknown>>;
}, z.z.core.$strip>;
export { createContactZodSchema, getAllContactsQueryZodSchema };
