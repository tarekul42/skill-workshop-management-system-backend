import z from "zod";

const initPaymentParamSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
});

const validatePaymentBodySchema = z.object({
  val_id: z.string().min(1, "val_id is required"),
  tran_id: z.string().optional(),
});

const refundPaymentBodySchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().optional(),
});

export {
  initPaymentParamSchema,
  refundPaymentBodySchema,
  validatePaymentBodySchema,
};
