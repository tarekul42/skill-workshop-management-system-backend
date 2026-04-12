import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
import envVariables from "../config/env.js";
import logger from "./logger.js";
const transporter = nodemailer.createTransport({
    secure: true,
    auth: {
        user: envVariables.EMAIL_SENDER.SMTP_USER,
        pass: envVariables.EMAIL_SENDER.SMTP_PASS,
    },
    port: Number(envVariables.EMAIL_SENDER.SMTP_PORT),
    host: envVariables.EMAIL_SENDER.SMTP_HOST,
});
const sendEmail = async ({ to, subject, templateName, templateData, attachments, }) => {
    try {
        const templatePath = path.join(__dirname, `templates/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, templateData);
        const info = await transporter.sendMail({
            from: envVariables.EMAIL_SENDER.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map((attachments) => ({
                filename: attachments.filename,
                content: attachments.content,
                contentType: attachments.contentType,
            })),
        });
        logger.info({ msg: `\u2709\uFE0F Email sent to ${to}: ${info.messageId}` });
    }
    catch (error) {
        logger.error({ msg: "Email sending error", err: error });
        throw error; // Let the caller (BullMQ worker) decide what to do
    }
};
export default sendEmail;
