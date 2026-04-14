import { mailQueue } from "../jobs/mail.queue.js";
import logger from "./logger.js";
import sendEmail from "./sendEmail.js";

export interface DirectEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, unknown>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmailDirect = async (
  options: DirectEmailOptions,
): Promise<void> => {
  // On long-running server, use BullMQ for reliability (retries, etc.)
  if (process.env.USE_BULLMQ === "true") {
    try {
      await mailQueue.add("email", options);
      return;
    } catch (err) {
      logger.error({
        msg: "Failed to queue email, falling back to direct send",
        err,
      });
      // Fall through to direct send
    }
  }

  // Direct send (Vercel serverless)
  await sendEmail(options);
};
