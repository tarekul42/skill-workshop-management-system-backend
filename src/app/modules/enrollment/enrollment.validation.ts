import z from "zod";
import { ENROLLMENT_STATUS } from "./enrollment.interface";

const createEnrollmentZodSchema = z.object({
  workshop: z.string(),
  studentCount: z.number().int().positive(),
});

const updateEnrollmentStatusZodSchema = z.object({
  status: z.enum(Object.values(ENROLLMENT_STATUS) as [string, ...string[]]),
});

export { createEnrollmentZodSchema, updateEnrollmentStatusZodSchema };
