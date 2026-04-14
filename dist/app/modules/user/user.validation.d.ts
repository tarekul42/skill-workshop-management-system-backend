import z from "zod";
/**
 * Shared password complexity rules.
 * Reused across registration, change-password, and set-password flows.
 */
export declare const passwordZodSchema: z.ZodString;
declare const createUserZodSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    address: z.ZodOptional<z.ZodString>;
}, z.z.core.$strip>;
declare const updateUserZodSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    address: z.ZodOptional<z.ZodString>;
    isDeleted: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    isVerified: z.ZodOptional<z.ZodBoolean>;
    role: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
}, z.z.core.$strip>;
declare const changePasswordZodSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.z.core.$strip>;
declare const setPasswordZodSchema: z.ZodObject<{
    password: z.ZodString;
}, z.z.core.$strip>;
declare const resetPasswordZodSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, z.z.core.$strip>;
declare const forgotPasswordZodSchema: z.ZodObject<{
    email: z.ZodString;
}, z.z.core.$strip>;
export { changePasswordZodSchema, createUserZodSchema, forgotPasswordZodSchema, resetPasswordZodSchema, setPasswordZodSchema, updateUserZodSchema, };
