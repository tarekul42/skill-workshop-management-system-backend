import { Worker } from "bullmq";
import { uploadBufferToCloudinary } from "../config/cloudinary.config";
import redisConnection from "../config/redis.connection";
import Payment from "../modules/payment/payment.model";
import { generatePDF } from "../utils/invoice";
import logger from "../utils/logger";
import sendEmail from "../utils/sendEmail";
import { MAIL_QUEUE } from "./mail.queue";
export const mailWorker = new Worker(MAIL_QUEUE, async (job) => {
    const { type, payload } = job.data;
    logger.info({ msg: `Processing job ${job.id} of type ${type}` });
    try {
        switch (type) {
            case "forgot-password":
                await sendEmail({
                    to: payload.email,
                    subject: "Password Reset",
                    templateName: "forgetPassword",
                    templateData: {
                        name: payload.name,
                        resetUILink: payload.resetUILink,
                    },
                });
                break;
            case "otp":
                await sendEmail({
                    to: payload.email,
                    subject: "OTP Verification",
                    templateName: "otp",
                    templateData: {
                        name: payload.name,
                        otp: payload.otp,
                    },
                });
                break;
            case "invoice": {
                const { pdfBufferData, ...invoiceData } = payload;
                // Re-generate PDF if buffer wasn't passed (better to generate in worker to keep job size small)
                let pdfBuffer;
                if (pdfBufferData) {
                    pdfBuffer = Buffer.from(pdfBufferData, "base64");
                }
                else {
                    pdfBuffer = await generatePDF(invoiceData);
                }
                // Upload to Cloudinary if not already done or if we want to ensure it's there
                const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");
                if (cloudinaryResult) {
                    await Payment.findOneAndUpdate({ transactionId: invoiceData.transactionId }, { invoiceUrl: cloudinaryResult.secure_url });
                }
                await sendEmail({
                    to: payload.email,
                    subject: "Your Enrollment Invoice",
                    templateName: "invoice",
                    templateData: invoiceData,
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
    }
    catch (error) {
        logger.error({ msg: `Failed to process job ${job.id}`, err: error });
        throw error; // Let BullMQ handle retries
    }
}, {
    connection: redisConnection,
    concurrency: 5,
});
mailWorker.on("completed", (job) => {
    logger.info({ msg: `Job ${job.id} completed successfully` });
});
mailWorker.on("failed", (job, err) => {
    logger.error({ msg: `Job ${job?.id} failed`, err });
});
