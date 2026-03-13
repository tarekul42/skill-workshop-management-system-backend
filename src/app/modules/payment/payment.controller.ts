import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import PaymentService from "./payment.service";
import SSLService from "../sslCommerz/sslCommerz.service";

const initPayment = catchAsync(async (req: Request, res: Response) => {
  const enrollmentId = req.params.enrollmentId;

  const result = await PaymentService.initPayment(enrollmentId as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment initiated successfully",
    data: result,
  });
});

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const body = req.body;

  const result = await PaymentService.successPayment(
    query as Record<string, string>,
    body as Record<string, string>
  );

  if (result.success) {
    const params = new URLSearchParams({
      transactionId: String(query.transactionId ?? ""),
      message: result.message ?? "",
      amount: String(query.amount ?? ""),
      status: String(query.status ?? ""),
    });

    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?message=${encodeURIComponent(result.message ?? "Payment verification failed")}`,
    );
  }
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await PaymentService.failPayment(
    query as Record<string, string>,
  );

  const params = new URLSearchParams({
    transactionId: String(query.transactionId ?? ""),
    message: result.message ?? "",
    amount: String(query.amount ?? ""),
    status: String(query.status ?? ""),
  });

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  }
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await PaymentService.cancelPayment(
    query as Record<string, string>,
  );

  const params = new URLSearchParams({
    transactionId: String(query.transactionId ?? ""),
    message: result.message ?? "",
    amount: String(query.amount ?? ""),
    status: String(query.status ?? ""),
  });

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_CANCEL_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  }
});

const getInvoiceDownloadUrl = catchAsync(
  async (req: Request, res: Response) => {
    const paymentId = req.params.paymentId;

    const invoiceUrl = await PaymentService.getInvoiceDownloadUrl(
      paymentId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Invoice URL retrieved successfully",
      data: invoiceUrl,
    });
  },
);

const validatePayment = catchAsync(async (req: Request, res: Response) => {
  await SSLService.validatePayment(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment validated successfully",
    data: null,
  });
});

const PaymentController = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getInvoiceDownloadUrl,
  validatePayment,
};

export default PaymentController;
