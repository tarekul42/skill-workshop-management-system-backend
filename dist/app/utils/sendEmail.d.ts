interface SendEmailOptions {
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
declare const sendEmail: ({ to, subject, templateName, templateData, attachments, }: SendEmailOptions) => Promise<void>;
export default sendEmail;
