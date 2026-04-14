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
export declare const sendEmailDirect: (options: DirectEmailOptions) => Promise<void>;
