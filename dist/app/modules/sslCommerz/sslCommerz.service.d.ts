import { ISSLCommerz } from "./sslCommerz.interface";
declare const SSLService: {
    sslPaymentInit: (payload: ISSLCommerz) => Promise<any>;
    validatePayment: (payload: {
        val_id: string;
        tran_id: string;
    }) => Promise<void>;
};
export default SSLService;
