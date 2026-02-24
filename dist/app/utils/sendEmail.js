"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
const ejs_1 = __importDefault(require("ejs"));
const http_status_codes_1 = require("http-status-codes");
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("../config/env"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    auth: {
        user: env_1.default.EMAIL_SENDER.SMTP_USER,
        pass: env_1.default.EMAIL_SENDER.SMTP_PASS,
    },
    port: Number(env_1.default.EMAIL_SENDER.SMTP_PORT),
    host: env_1.default.EMAIL_SENDER.SMTP_HOST,
});
const sendEmail = async ({ to, subject, templateName, templateData, attachments, }) => {
    try {
        const templatePath = path_1.default.join(__dirname, `templates/${templateName}.ejs`);
        const html = await ejs_1.default.renderFile(templatePath, templateData);
        const info = await transporter.sendMail({
            from: env_1.default.EMAIL_SENDER.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map((attachments) => ({
                filename: attachments.filename,
                content: attachments.content,
                contentType: attachments.contentType,
            })),
        });
        console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);
    }
    catch (error) {
        console.log("Email sending error:", error.message);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email sending error");
    }
};
exports.default = sendEmail;
