import { Worker } from "bullmq";
interface MailJobData {
    type: "forgot-password" | "otp" | "invoice";
    payload: Record<string, any>;
}
export declare const mailWorker: Worker<MailJobData, any, string>;
export {};
