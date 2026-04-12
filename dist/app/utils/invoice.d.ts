interface IInvoiceData {
    transactionId: string;
    enrollmentDate: Date;
    userName: string;
    workshopTitle: string;
    studentCount: number;
    totalAmount: number;
}
declare const generatePDF: (invoiceData: IInvoiceData) => Promise<Buffer>;
export { generatePDF, IInvoiceData };
