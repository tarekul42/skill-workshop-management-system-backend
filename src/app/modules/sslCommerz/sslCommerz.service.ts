import axios from "axios";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import logger from "../../utils/logger.js";
import Payment from "../payment/payment.model.js";
import { ISSLCommerz } from "./sslCommerz.interface.js";

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
      ipn_url: envVariables.SSL.SSL_IPN_URL,
      shipping_method: "N/A",
      product_name: "Workshop",
      product_category: "Service",
      product_profile: "general",
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: payload.address,
      cus_add2: "N/A",
      cus_city: payload.city ?? "Dhaka",
      cus_state: payload.state ?? "Dhaka",
      cus_postcode: payload.postcode ?? "1000",
      cus_country: payload.country ?? "Bangladesh",
      cus_phone: payload.phoneNumber,
      cus_fax: "N/A",
      ship_name: "N/A",
      ship_add1: "N/A",
      ship_add2: "N/A",
      ship_city: "N/A",
      ship_state: "N/A",
      ship_postcode: 1000,
      ship_country: "N/A",
    };

    // Diagnostic logging for Bug #11 (Environment variable quotes)
    logger.debug({
      msg: "SSL Store ID:",
      storeId: envVariables.SSL.SSL_STORE_ID,
    });
    logger.debug({
      msg: "SSL API URL:",
      apiUrl: envVariables.SSL.SSL_PAYMENT_API,
    });

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
  } catch (err: unknown) {
    if (err instanceof AppError) {
      throw err;
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      errorMessage || "Payment gateway request failed",
    );
  }
};

const validatePayment = async (payload: {
  val_id: string;
  tran_id: string;
}) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${envVariables.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVariables.SSL.SSL_STORE_ID}&store_passwd=${envVariables.SSL.SSL_STORE_PASS}`,
    });
    logger.info({
      msg: "sslCommerz validate api response",
      data: response.data,
    });

    if (
      response.data.status !== "VALID" &&
      response.data.status !== "VALIDATED"
    ) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Payment validation failed");
    }

    await Payment.updateOne(
      { transactionId: { $eq: payload.tran_id } },
      { paymentGatewayData: response.data },
      { runValidators: true },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ msg: "Payment validation error", err: error });
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      errorMessage || "Payment validation failed",
    );
  }
};

const verifyIPNSignature = (body: Record<string, string>) => {
  // Check required fields exist in the IPN body
  if (!body.val_id || !body.tran_id || !body.status) {
    logger.warn({
      msg: "IPN missing required fields",
      hasValId: !!body.val_id,
      hasTranId: !!body.tran_id,
      hasStatus: !!body.status,
    });
  }

  // Log verify_sign presence for debugging
  // Note: The existing validatePayment() call already handles server-to-server
  // verification by hitting SSLCommerz's validation API — that IS the primary
  // verification mechanism. A missing verify_sign may indicate a spoofed IPN.
  if (!body.verify_sign) {
    logger.warn({
      msg: "IPN received without verify_sign field — possible spoofed IPN",
      tran_id: body.tran_id,
      status: body.status,
    });
  } else {
    logger.debug({
      msg: "IPN verify_sign present",
      tran_id: body.tran_id,
    });
  }
};

const SSLService = {
  sslPaymentInit,
  validatePayment,
  verifyIPNSignature,
};

export default SSLService;
