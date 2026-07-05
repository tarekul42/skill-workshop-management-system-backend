import axios from "axios";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { redisClient } from "../../config/redis.config.js";
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
  // Distributed lock: prevent concurrent IPN + callback from both hitting
  // the SSLCommerz validation API for the same val_id simultaneously.
  const lockKey = `lock:payment:val_id:${payload.val_id}`;
  const acquired = await redisClient.set(lockKey, "locked", { NX: true, EX: 30 });
  if (!acquired) {
    logger.info({
      msg: "Payment validation already in progress for this val_id, skipping duplicate",
      val_id: payload.val_id,
      tran_id: payload.tran_id,
    });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${envVariables.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVariables.SSL.SSL_STORE_ID}&store_passwd=${envVariables.SSL.SSL_STORE_PASS}`,
    });
    logger.info({
      msg: "sslCommerz validate api response",
      status: response.data?.status,
      tran_id: response.data?.tran_id,
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
  // Reject if required fields are missing
  if (!body.val_id || !body.tran_id || !body.status) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "IPN missing required fields: val_id, tran_id, status",
    );
  }

  // verify_sign is SSLCommerz's HMAC-style signature.
  // Without it the IPN cannot be trusted — it may be a spoofed callback.
  if (!body.verify_sign) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "IPN missing verify_sign — possible spoofed callback",
    );
  }

  // Validate the verify_sign hash:
  //   MD5(store_id + ":" + tran_id + ":" + store_passwd)
  const expectedSign = crypto
    .createHash("md5")
    .update(
      `${envVariables.SSL.SSL_STORE_ID}:${body.tran_id}:${envVariables.SSL.SSL_STORE_PASS}`,
    )
    .digest("hex")
    .toLowerCase();

  const receivedSign = body.verify_sign.toLowerCase();
  if (receivedSign !== expectedSign) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "IPN verify_sign mismatch — possible spoofed callback",
    );
  }

  logger.info({
    msg: "IPN signature verified",
    tran_id: body.tran_id,
  });
};

const sslRefundPayment = async (payload: {
  bankTranId: string;
  amount: number;
  remarks?: string;
}) => {
  const data = new URLSearchParams();
  data.append("store_id", envVariables.SSL.SSL_STORE_ID);
  data.append("store_passwd", envVariables.SSL.SSL_STORE_PASS);
  data.append("bank_tran_id", payload.bankTranId);
  data.append("refund_amount", payload.amount.toFixed(2));
  data.append("refund_remarks", payload.remarks ?? "Refund requested");

  const response = await axios({
    method: "POST",
    url: `${envVariables.SSL.SSL_PAYMENT_API.replace("gwprocess/v4/api.php", "gwprocess/v4/refund_api.php")}`,
    data,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30000,
  });

  if (!response.data || response.data.status !== "success") {
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      response.data?.error_reason || "SSLCommerz refund failed",
    );
  }

  return response.data;
};

const SSLService = {
  sslPaymentInit,
  validatePayment,
  verifyIPNSignature,
  sslRefundPayment,
};

export default SSLService;
