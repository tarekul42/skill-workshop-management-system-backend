import ejs from "ejs";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import path from "path";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import logger from "./logger";

const transporter = nodemailer.createTransport({
  secure: true,
  auth: {
    user: envVariables.EMAIL_SENDER.SMTP_USER,
    pass: envVariables.EMAIL_SENDER.SMTP_PASS,
  },
  port: Number(envVariables.EMAIL_SENDER.SMTP_PORT),
  host: envVariables.EMAIL_SENDER.SMTP_HOST,
});

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

const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
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
    logger.info({ msg: `\u2709\uFE0F Email sent to ${to}: ${info.messageId}`,
    });
  } catch (error: unknown) {
    logger.error({ msg: "Email sending error", err: error });
    throw new AppError(StatusCodes.BAD_REQUEST, "Email sending error");
  }
};

export default sendEmail;
