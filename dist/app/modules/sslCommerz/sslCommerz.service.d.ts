import { ISSLCommerz } from "./sslCommerz.interface.js";
declare const SSLService: {
    sslPaymentInit: (payload: ISSLCommerz) => Promise<any>;
    validatePayment: (payload: {
        val_id: string;
        tran_id: string;
    }) => Promise<void>;
    verifyIPNSignature: (body: Record<string, string>) => void;
};
export default SSLService;
