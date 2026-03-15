import { StatusCodes } from "http-status-codes";
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";
import logger from "./logger";

interface IInvoiceData {
  transactionId: string;
  enrollmentDate: Date;
  userName: string;
  workshopTitle: string;
  studentCount: number;
  totalAmount: number;
}

const generatePDF = async (invoiceData: IInvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffer: Uint8Array[] = [];

    doc.on("data", (chunk) => buffer.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(buffer));
    });
    doc.on("error", (err) => {
      logger.error({ message: "PDF creation error", err });
      reject(
        new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `PDF creation failed. Error: ${err.message}`,
        ),
      );
    });

    // PDF content
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Transaction ID: ${invoiceData.transactionId}`);
    doc.text(
      `Enrollment Date: ${invoiceData.enrollmentDate.toLocaleDateString("en-US")}`,
    );
    doc.text(`Customer: ${invoiceData.userName}`);
    doc.moveDown();
    doc.text(`Workshop: ${invoiceData.workshopTitle}`);
    doc.text(`Guests: ${invoiceData.studentCount}`);
    doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`);
    doc.moveDown();
    doc.text("Thank you for enrolling with us!", { align: "center" });
    doc.end();
  });
};

export { generatePDF, IInvoiceData };
