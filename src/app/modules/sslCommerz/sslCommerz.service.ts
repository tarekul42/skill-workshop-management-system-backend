import axios from "axios";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { ISSLCommerz } from "./sslCommerz.interface";

const sslPaymentInit = async (payload: ISSLCommerz) => {
  try {
    const data = {
      store_id: envVariables.SSL.SSL_STORE_ID,
      store_passwd: envVariables.SSL.SSL_STORE_PASS,
      total_amount: payload.amount,
      currency: "BDT",
      tran_id: payload.transactionId,
      success_url: `${envVariables.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
      fail_url: `${envVariables.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
      cancel_url: `${envVariables.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
      // ipn_url: "http://localhost:3030/ipn",
      shipping_method: "N/A",
      product_name: "Workshop",
      product_category: "Service",
      product_profile: "general",
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_add2: "N/A",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: payload.phoneNumber,
      cus_fax: "01711111111",
      ship_name: "N/A",
      ship_add1: "N/A",
      ship_add2: "N/A",
      ship_city: "N/A",
      ship_state: "N/A",
      ship_postcode: 1000,
      ship_country: "N/A",
    };

    // Diagnostic logging for Bug #11 (Environment variable quotes)
    // eslint-disable-next-line no-console
    console.log("SSL Store ID:", envVariables.SSL.SSL_STORE_ID);
    // eslint-disable-next-line no-console
    console.log("SSL API URL:", envVariables.SSL.SSL_PAYMENT_API);

    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    const response = await axios({
      method: "POST",
      url: envVariables.SSL.SSL_PAYMENT_API,
      data: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 30000, // 30 seconds
    });

    if (!response.data?.GatewayPageURL) {
      throw new AppError(
        StatusCodes.BAD_GATEWAY,
        "Invalid response from payment gateway",
      );
    }
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      err?.message || "Payment gateway request failed",
    );
  }
};

const SSLService = {
  sslPaymentInit,
};

export default SSLService;
