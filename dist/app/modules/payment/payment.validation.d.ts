import z from "zod";
declare const initPaymentParamSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
}, z.z.core.$strip>;
declare const validatePaymentBodySchema: z.ZodObject<{
    val_id: z.ZodString;
    tran_id: z.ZodOptional<z.ZodString>;
}, z.z.core.$strip>;
declare const refundPaymentBodySchema: z.ZodObject<{
    paymentId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, z.z.core.$strip>;
export { initPaymentParamSchema, refundPaymentBodySchema, validatePaymentBodySchema, };
