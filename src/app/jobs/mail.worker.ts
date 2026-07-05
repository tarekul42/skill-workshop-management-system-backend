import { Job, Worker } from "bullmq";
import { uploadBufferToCloudinary } from "../config/cloudinary.config.js";
import redisConnection from "../config/redis.connection.js";
import Payment from "../modules/payment/payment.model.js";
import { generatePDF, IInvoiceData } from "../utils/invoice.js";
import logger from "../utils/logger.js";
import sendEmail from "../utils/sendEmail.js";
import { MAIL_QUEUE } from "./mail.queue.js";

export const mailWorker = new Worker(
  MAIL_QUEUE,
  async (
    job: Job<{
      to: string;
      subject: string;
      templateName: string;
      templateData?: Record<string, unknown>;
      attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
      }[];
    }>,
  ) => {
    const { to, subject, templateName, templateData, attachments } = job.data;

    logger.info({
      msg: `Processing job ${job.id} with template ${templateName}`,
    });

    try {
      if (templateName === "invoice") {
        const invoiceData = templateData as unknown as IInvoiceData;

        const pdfBuffer = await generatePDF(invoiceData);

        const cloudinaryResult = await uploadBufferToCloudinary(
          pdfBuffer,
          "invoice",
        );

        if (cloudinaryResult) {
          await Payment.findOneAndUpdate(
            { transactionId: invoiceData.transactionId },
            { invoiceUrl: cloudinaryResult.secure_url },
          );
        }

        await sendEmail({
          to,
          subject,
          templateName,
          templateData,
          attachments: [
            {
              filename: "invoice.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } else {
        await sendEmail({ to, subject, templateName, templateData, attachments });
      }
    } catch (error) {
      logger.error({ msg: `Failed to process job ${job.id}`, err: error });
      throw error;
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
