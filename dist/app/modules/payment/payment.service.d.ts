declare const PaymentService: {
    initPayment: (enrollmentId: string, userId: string) => Promise<{
        paymentUrl: any;
    }>;
    successPayment: (query: Record<string, string>, body: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    failPayment: (query: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    cancelPayment: (query: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    getInvoiceDownloadUrl: (paymentId: string, userId: string, userRole: string) => Promise<string>;
    handleIPN: (body: Record<string, string>) => Promise<{
        received: boolean;
    }>;
    refundPayment: (paymentId: string, userId: string, reason?: string) => Promise<{
        success: boolean;
        message: string;
    }>;
};
export default PaymentService;
