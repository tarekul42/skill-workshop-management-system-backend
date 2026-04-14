import { mailQueue } from "../jobs/mail.queue.js";
import logger from "./logger.js";
import sendEmail from "./sendEmail.js";
export const sendEmailDirect = async (options) => {
    // On long-running server, use BullMQ for reliability (retries, etc.)
    if (process.env.USE_BULLMQ === "true") {
        try {
            await mailQueue.add("email", options);
            return;
        }
        catch (err) {
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
