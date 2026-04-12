import { Job, Worker } from "bullmq";
import { uploadBufferToCloudinary } from "../config/cloudinary.config";
import redisConnection from "../config/redis.connection";
import Payment from "../modules/payment/payment.model";
import { generatePDF, IInvoiceData } from "../utils/invoice";
import logger from "../utils/logger";
import sendEmail from "../utils/sendEmail";
import { MAIL_QUEUE } from "./mail.queue";

interface MailJobData {
  type: "forgot-password" | "otp" | "invoice";
  payload: Record<string, unknown>;
}

export const mailWorker = new Worker(
  MAIL_QUEUE,
  async (job: Job<MailJobData>) => {
    const { type, payload } = job.data;

    logger.info({ msg: `Processing job ${job.id} of type ${type}` });

    try {
      switch (type) {
        case "forgot-password":
          await sendEmail({
            to: payload.email as string,
            subject: "Password Reset",
            templateName: "forgetPassword",
            templateData: {
              name: payload.name as string,
              resetUILink: payload.resetUILink as string,
            },
          });
          break;

        case "otp":
          await sendEmail({
            to: payload.email as string,
            subject: "OTP Verification",
            templateName: "otp",
            templateData: {
              name: payload.name as string,
              otp: payload.otp as string,
            },
          });
          break;

        case "invoice": {
          const { pdfBufferData, ...invoiceData } = payload;

          // Re-generate PDF if buffer wasn't passed (better to generate in worker to keep job size small)
          let pdfBuffer: Buffer;
          if (pdfBufferData) {
            pdfBuffer = Buffer.from(pdfBufferData as string, "base64");
          } else {
            pdfBuffer = await generatePDF(invoiceData as unknown as IInvoiceData);
          }

          // Upload to Cloudinary if not already done or if we want to ensure it's there
          const cloudinaryResult = await uploadBufferToCloudinary(
            pdfBuffer,
            "invoice",
          );

          if (cloudinaryResult) {
            await Payment.findOneAndUpdate(
              { transactionId: (invoiceData as unknown as IInvoiceData).transactionId },
              { invoiceUrl: cloudinaryResult.secure_url },
            );
          }

          await sendEmail({
            to: payload.email as string,
            subject: "Your Enrollment Invoice",
            templateName: "invoice",
            templateData: invoiceData as unknown as Record<string, unknown>,
            attachments: [
              {
                filename: "invoice.pdf",
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
          break;
        }

        default:
          logger.warn({ msg: `Unknown job type: ${type}` });
      }
    } catch (error) {
      logger.error({ msg: `Failed to process job ${job.id}`, err: error });
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

mailWorker.on("completed", (job) => {
  logger.info({ msg: `Job ${job.id} completed successfully` });
});

mailWorker.on("failed", (job, err) => {
  logger.error({ msg: `Job ${job?.id} failed`, err });
});
